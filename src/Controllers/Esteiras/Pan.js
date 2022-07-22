const Pan = require('../../APIs/Pan');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, fasesAgilus } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []
var logs = false

const PanEsteira = async (pool, log) => {
  try {
    console.log('[Pan Esteira]=> Iniciando...')
    const pan = await new Pan();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await pan.refreshToken(log)
    if (loadAPI) {
      var date = moment(new Date(), 'DD/MM/YYYY').format('DD-MM-YYYY');
      var dia = Number(date.slice(0,2))
      var mes = Number(date.slice(3,5))
      var ano = Number(date.slice(6,10))
      if (dia - 7 <= 0) {
        var aux2 = 31
        mes -= 1
        if (mes == 4 || mes == 6 || mes == 9 || mes == 11) aux2 = 30
        if (mes == 2) aux2 = 28
        if (mes <= 0) {
          dia = 31 - ((dia - 7) * - 1)
          mes = 12
          ano -= 1
        } else dia = aux2 - ((dia - 7) * - 1)
      } else dia -= 7
      if (dia < 10) dia = `0${dia}`
      if (mes < 10) mes = `0${mes}`
      var agilus = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',623).execute('pr_getPropostas_by_Bank_and_Date')
      agilus.recordset = agilus.recordset.filter(r=> r.NumeroContrato && r.NumeroContrato != 0)
      console.log(agilus.recordset.length)
      agilus.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, agilus: proposta }
        if (queue.length == 1) return verifyFase(pan, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Pan Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { PanEsteira }

async function verifyFase(pan, pool) {
  if (queue.length <= 0 || !queue[0]) return console.log(`[Pan Esteira]=> Finalizado!`);
  await timeout(10)
  var fila = queue[0]
  const getProposta = await pan.getContrato(fila.agilus.Cpf, { af: "PAN ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data[0].proposta.status && getProposta.data[0].esteira.atividade && getProposta.data[0].formalizacao.status && getProposta.data[0].esteira.atividade != 'Aviso De Cadastro Cartao') {
      var faseAtividade = fases.find(r=> getProposta.data[0].esteira.atividade.includes(r.atividade) && r.situacao == getProposta.data[0].proposta.status)
      if (faseAtividade) {
        var fase = faseAtividade.status[getProposta.data[0].formalizacao.status]
        if (fase) {
          if (!fase.oldFase || !fase.oldFase[0] || fase.oldFase.find(r=> r == fila.agilus.CodFase)) {
            fila.faseName = fasesAgilus[fase.newFase] ? fasesAgilus[fase.newFase] : 'Não encontrada...'
            await pool.request()
            .input('contrato',fila.agilus.NumeroContrato)
            .input('fase',fase.newFase)
            .input('bank',623)
            .input('texto',`[PAN ESTEIRA]=> Fase alterada para: ${fila.faseName}!${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
            //.execute('pr_changeFase_by_contrato')
            if (logs) console.log(`[Pan Esteira]=> Contrato: ${fila.agilus.NumeroContrato} - FaseOLD: ${fila.agilus.Fase} - FaseNew: ${fila.faseName}${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
          }
        } else console.log(`[Pan Esteira  ${fila.agilus.NumeroContrato}] => Novo Status - Situação: ${getProposta.data[0].proposta.status} - Atividade: ${getProposta.data[0].esteira.atividade} - Status: ${getProposta.data[0].formalizacao.status}`)
      } else console.log(`[Pan Esteira  ${fila.agilus.NumeroContrato}] => Nova Atividade - Situação: ${getProposta.data[0].proposta.status} - Atividade: ${getProposta.data[0].esteira.atividade} - Status: ${getProposta.data[0].formalizacao.status}`)
    }
  }
  await timeout(10)
  if (queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato), 1)
  verifyFase(pan, pool)
}

const fases = [
  { situacao: 'INTEGRADA', atividade: 'Proposta Finalizada', status: {
    'APROVADO': { newFase: '3920', oldFase: ['2','9232','9923','692','9']},
  }},
  { situacao: 'INTEGRADA', atividade: 'Proposta Integrada', status: {
    'APROVADO': { newFase: '3920', oldFase: ['2','9232','9923','692','9']},
  }},
  { situacao: 'ANDAMENTO', atividade: 'Negociacao em andamento', status: {
    'APROVADO': { newFase: '10293' },
    'PENDENTE_IDENTIDADE_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura! Precisamos tambem de uma foto do documento do cliente!' },
    'PENDENTE_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura!' },
    'REABRE_DOC_ID_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura e solicitar novo RG parar o cliente!' },
  }},
  { situacao: 'ANDAMENTO', atividade: 'Aguarda Autorização INSS', status: {
    'APROVADO': { newFase: '692' },
  }},
  { situacao: 'ANDAMENTO', atividade: 'Represa Beneficio INSS', status: {
    'APROVADO': { newFase: '323' },
  }},
  { situacao: 'ANDAMENTO', atividade: 'Rep CPF inexistente INSS', status: {
    'APROVADO': { newFase: '10293', motivo: 'OP-Verificar se o beneficio do cliente ainda esta ativo, e se foi digitado com o cpf/matrícula correto' },
  }},
  { situacao: 'ANDAMENTO', atividade: 'Ajuste Seguro', status: {
    'NAO_INICIADO': { newFase: '10293', motivo: 'OP-Verificar a especie do cliente, se for 87/88 é sem seguro!' },
  }},
  { situacao: 'PENDENTE', atividade: 'Aguardando Fluxo Digital', status: {
    'PENDENTE_IDENTIDADE_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura! Precisamos tambem de uma foto do documento do cliente!' },
    'PENDENTE_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura!' },
    'NOVA_ASSINATURA_NECESSARIA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura!' },
    'PENDENTE_IDENTIDADE': { newFase: '9', oldFase: ['2','692'], motivo: 'Favor anexar doc do cliente!' },
    'REABRE_DOC_ID': { newFase: '9', oldFase: ['2','692'], motivo: 'Favor anexar doc do cliente!' },
    'REABRE_DOC_ID_ASSINATURA': { newFase: '9', oldFase: ['2','692'], motivo: 'Cliente nao finalizou a assinatura! Favor anexar doc do cliente!' },
    'REPROVADO': { newFase: '10293', motivo: 'OP-Verificar o motivo da reprova' },
  }},
  { situacao: 'PENDENTE', atividade: 'Aguarda Reserva FGTS', status: {
    'APROVADO': { newFase: '2' },
  }},
  { situacao: 'PENDENTE', atividade: 'Analise Promotora', status: {
    'APROVADO': { newFase: '1111' },
  }},
  { situacao: 'PENDENTE', atividade: 'Reenvia Solicitação FGTS', status: {
    'APROVADO': { newFase: '10293', motivo: 'OP-Verificar o motivo da reprova' },
  }},
  { situacao: 'PENDENTE', atividade: 'Ag. aciona esteira FGTS', status: {
    'APROVADO': { newFase: '692' },
  }},
  { situacao: 'PENDENTE', atividade: 'Ajuste Banco Digital', status: {
    'PENDENTE_IDENTIDADE_ASSINATURA': { newFase: '120001', oldFase: ['2','692','9'], motivo: 'Cliente nao finalizou a assinatura! Precisamos tambem de uma foto do documento do cliente!' },
  }},
  { situacao: 'CANCELADA', atividade: 'Proposta Cancelada', status: {
    'NAO_INICIADO': { newFase: '10293' },
    'PENDENTE_ASSINATURA': { newFase: '10293' },
    'PENDENTE_IDENTIDADE_ASSINATURA': { newFase: '10293' },
  }},
  { situacao: 'REPROVADA', atividade: 'Rep Pagto. Digital', status: {
    'NAO_INICIADO': { newFase: '10293', oldFase: ['2','692','9'], motivo: 'OP-Verificar o banco do cliente, caso seja pan, precisa ser recadastrada manualmente' },
  }},
  { situacao: 'REPROVADA', atividade: 'Rep CPF inexistente INSS', status: {
    'APROVADO':{ newFase: '10293', motivo: 'OP-Verificar se o benefício do cliente ainda está ativo, e se foi digitado com o cpf/matrícula correto' },
  }},
  { situacao: 'REPROVADA', atividade: 'Proposta Reprovada', status: {
    'APROVADO': { newFase: '10293', motivo: 'OP-Verificar o motivo da reprova' },
    'REPROVADO': { newFase: '10293', motivo: 'OP-Verificar o motivo da reprova' },
  }},
]


async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }