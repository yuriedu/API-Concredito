const Facta = require('../../APIs/Facta');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

var propostas = []

const FactaEsteira = async (pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    const facta = await new Facta();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await facta.refreshToken(log)
    if (loadAPI) {
      const getEsteira = await facta.getEsteira(log)
      if (getEsteira && getEsteira.data) {
        if (getEsteira.data.propostas && getEsteira.data.propostas[0] && getEsteira.data.propostas[0].codigo_af) {
          getEsteira.data.propostas = getEsteira.data.propostas.filter(r=> !r.status_proposta.includes('186 - CLIENTE COM INADIMPLENCIA') && !r.status_proposta.includes('AGUARDANDO ASSINATURA DIGITAL') && !r.status_proposta.includes('AGUARDA CANCELAMENTO'))
          getEsteira.data.propostas.forEach(async(proposta, index)=>{
            if (index == 0) {
              var test = await facta.getProposta(proposta.codigo_af, log)
              console.log(proposta.codigo_af)
              console.log(test.data)
              if (proposta.status_proposta && proposta.codigo_af) {
                var fase = false
                if (proposta.status_proposta.includes('AGUARDA AVERBACAO')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('AVERBADOO')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('ANALISE MESA DE CONFERENCIA')) fase = 2 //AGUARDANDO AVERBAÇÃO
                if (proposta.status_proposta.includes('AGUARDA ATUACAO MASTER')) fase = 0 //MASTER
                if (proposta.status_proposta.includes('VALIDANDO DOCUMENTOS')) fase = 692 //PROPOSTA EM ANALISE BANCO
                if (proposta.status_proposta.includes('CONTRATO PAGO')) fase = 3 //PAGO AO CLIENTE
                if (proposta.status_proposta.includes('ESTEIRA DE ANALISE')) fase = 4002 //ASSINADO / RESPONDIDO
                if (proposta.status_proposta.includes('CANCELADO')) fase = 700 //REPROVADO
                if (proposta.status_proposta.includes('PENDENTE')) fase = 9 //PENDENTE
                if (fase) {
                  const propostaDB = await pool.request().input('contrato', proposta.codigo_af).input('fase',fase).execute('pr_getProposta_by_contrato_and_not_fase');
                  if (propostaDB.recordset[0]) {
                    if (fase == 3 && propostaDB.recordset[0].CodFase != 2) return;
                    if (fase == 700 || fase == 9) {
                      propostas[propostas.length] = { proposta: proposta, agilus: propostaDB.recordset[0], fase: fase }
                    } else {
                      await pool.request().input('id', propostaDB.recordset[0].IdContrato).input('faseDestino',fase).input('CodContrato',proposta.codigo_af).input('texto','[ESTEIRA]=> Fase alterada para a mesma que está no banco!').execute('pr_changeFase_by_contrato')
                      return console.log(`[Esteira]=> Contrato: ${proposta.codigo_af} - Fase Antiga: ${propostaDB.recordset[0].Fase} - Nova Fase: ${fase}`)
                    }
                  }
                } else console.log(`[Facta Esteira]=> Nova Fase: ${proposta.status_proposta}`)
              }
            }
          })
        } else {
          if (getEsteira.data.msg) return { status: false, error: `[7]=> ${getEsteira.data.msg}` }
          if (getEsteira.data.message) return { status: false, error: `[6]=> ${getEsteira.data.message}` }
          if (getEsteira.data.mensagem) return { status: false, error: `[5]=> ${getEsteira.data.mensagem}` }
          if (getEsteira.data.propostas && (!getEsteira.data.propostas[0] || !getEsteira.data.propostas[0].codigo_af)) return { status: false, error: `[4]=> Sem propostas na esteira...` }
          console.log(`[Facta Esteira Error(1)]=>`)
          console.log(getEsteira.data)
          return { status: false, error: '[3]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde...' }
        }
      } else return { status: false, error: '[2]=> Ocorreu algum erro ao puxar todas as propostas! Tente novamente mais tarde', }
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[Facta Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { FactaEsteira }

function verifyReason() {

}