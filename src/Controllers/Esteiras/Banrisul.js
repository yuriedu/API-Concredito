const Banrisul = require('../../APIs/Banrisul');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, fasesAgilus } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []
var logs = true

const BanrisulEsteira = async (pool, log) => {
  try {
    console.log('[Banrisul Esteira]=> Iniciando...')
    const banrisul = await new Banrisul();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await banrisul.refreshToken(log)
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
      var agilus = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',41).execute('pr_getPropostas_by_Bank_and_Date')
      agilus.recordset = agilus.recordset.filter(r=> r.NumeroContrato && r.NumeroContrato != 0)
      agilus.recordset.forEach((proposta, index)=>{
        queue[queue.length] = { codigo: proposta.NumeroContrato, agilus: proposta }
        if (queue.length == 1) return verifyFase(banrisul, pool)
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Facta Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { BanrisulEsteira }

async function verifyFase(banrisul, pool) {
  if (queue.length <= 0 || !queue[0]) return console.log(`[Banrisul Esteira]=> Finalizado!`);
  await timeout(500)
  var fila = queue[0]
  const getProposta = await banrisul.getStatus(fila.agilus.NumeroContrato, { af: "BANRISUL ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.retorno && getProposta.data.retorno.situacao && getProposta.data.retorno.situacao.andamento && getProposta.data.retorno.situacao.descricao) {
      var faseSituacao = fases.find(r=> getProposta.data.retorno.situacao.andamento == r.situacao)
      if (faseSituacao) {
        var fase = faseSituacao.atividades[`${getProposta.data.retorno.situacao.descricao}`]
        if (fase) {
          if (!fase.oldFase || !fase.oldFase[0] || fase.oldFase.find(r=> r == fila.agilus.CodFase)) {
            fila.faseName = fasesAgilus[fase.newFase] ? fasesAgilus[fase.newFase] : 'Não encontrada...'
            await pool.request()
            .input('contrato',fila.agilus.NumeroContrato)
            .input('fase',fase.newFase)
            .input('bank',41)
            .input('texto',`[BANRISUL ESTEIRA]=> Fase alterada para: ${fila.faseName}!${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
            .execute('pr_changeFase_by_contrato')
            if (logs) console.log(`[Banrisul Esteira]=> Contrato: ${fila.agilus.NumeroContrato} - FaseOLD: ${fila.agilus.Fase} - FaseNew: ${fila.faseName}${fase.motivo ? '\nMotivo: '+fase.motivo : ''}`)
          }
        } else console.log(`[Banrisul Esteira  ${fila.agilus.NumeroContrato}] => Nova Atividade - Situação: ${getProposta.data.retorno.situacao.andamento} - Descrição: ${getProposta.data.retorno.situacao.descricao} - Detalhes: ${getProposta.data.retorno.situacao.descricaoDetalhada}`)
      } else console.log(`[Banrisul Esteira  ${fila.agilus.NumeroContrato}] => Nova Situação - Situação: ${getProposta.data.retorno.situacao.andamento} - Descrição: ${getProposta.data.retorno.situacao.descricao} - Detalhes: ${getProposta.data.retorno.situacao.descricaoDetalhada}`)
    }
  }
  await timeout(2000)
  if (queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == fila.agilus.NumeroContrato), 1)
  verifyFase(banrisul, pool)
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const fases = [
  { situacao: 'APROVADA', atividades: {
    'PROPOSTA EFETIVADA': { newFase: '3920', oldFase: ['2','9232','9923','692','9'] },
  }},
  { situacao: 'ANDAMENTO', atividades: {
    'AGUARDANDO ASSINATURA/CAPTURA BIOMÉTRICA': { newFase: '120001', oldFase: ['4002','2'] },
    'PENDENTE SITE FORA DO AR': { newFase: '' },
    'PENDENTE': { newFase: '10293' },
    'AGUARD RETORNO SOLIC SALDO': { newFase: '11' },
    'PAPERLESS - ANALISE ASSINATURA ELETRÔNICA': { newFase: '692' },
    'AGUARD ENVIO SOLIC SALDO (CTC)': { newFase: '202552' },
  }},
  { situacao: 'REPROVADA', atividades: {
    'REPROVAÇÃO AUTOMÁTICA': { newFase: '10923' },
  }},
]