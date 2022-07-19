const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');
const moment = require(`moment`);
moment.locale("pt-BR");

var queue = []

const C6Esteira = async (pool, log) => {
  try {
    console.log('[C6 Esteira]=> Iniciando...')
    const c6 = await new C6();
    log.situation = `[1]=> Conectando na API...`
    const loadAPI = await c6.refreshToken(log)
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
      const propostas = await pool.request().input('date', new Date(`${ano}-${mes}-${dia} 00:00:00`)).input('bank',626).execute('pr_getPropostas_by_Bank_and_Date')
      console.log(propostas.recordset.length)
      propostas.recordset.forEach((proposta, index)=>{
        if (proposta.NumeroContrato) {
          queue[queue.length] = { codigo: proposta.NumeroContrato, proposta: proposta }
          if (queue.length == 1) return verifyFaseBank(c6, pool)
        }
      })
    } else return { status: false, error: '[1]=> Problema na conexão da API! Tente novamente mais tarde...' }
  } catch(err) {
    console.log(`[C6 Esteira ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6Esteira }

async function verifyFaseBank(c6, pool) {
  await timeout(3000)
  if (queue <= 0) return console.log(`[C6 Esteira]=> Finalizado!`);
  var proposta = queue[0].proposta
  const getProposta = await c6.getProposta('424742165', { af: "C6 ESTEIRA" })
  return console.log(getProposta.data)
  // const getProposta = await c6.getProposta(proposta.NumeroContrato, { af: "C6 ESTEIRA" })
  if (getProposta && getProposta.data) {
    if (getProposta.data.loan_track && getProposta.data.loan_track.current_activity_description) {
      var fase = 0
      if (proposta.CodFase != 3920 && getProposta.data.loan_track.current_activity_description.includes('PAGO')) fase = 3920 //PROPOSTA PAGA
      if (proposta.CodFase != 9232 && (proposta.CodFase == 1 || proposta.CodFase == 822) && getProposta.data.loan_track.current_activity_description.includes('AGUARDA FORM DIG WEB')) fase = 9232 //AGUARDANDO ASSINATURA DIGITAL
      if (proposta.CodFase != 1111 && getProposta.data.loan_track.current_activity_description.includes('ANALISE CORBAN')) fase = 1111 //AGUARDANDO ATUAÇÃO MASTER
      if (proposta.CodFase != 692 && getProposta.data.loan_track.current_activity_description.includes('ANALISE DOCUMENTAL')) fase = 692 //PROPOSTA EM ANALISE BANCO
      if (proposta.CodFase != 692 && getProposta.data.loan_track.current_activity_description.includes('MESA PREVENCAO')) fase = 692 //PROPOSTA EM ANALISE BANCO
      if (proposta.CodFase != 692 && getProposta.data.loan_track.current_activity_description.includes('ANALISE SELFIE')) fase = 692 //PROPOSTA EM ANALISE BANCO
      if (proposta.CodFase != 9 && getProposta.data.loan_track.current_activity_description.includes('PEN DOCUMENTOS')) fase = 9 //PENDENTE
      if (proposta.CodFase != 9 && getProposta.data.loan_track.current_activity_description.includes('AGUARDA AUTORIZACAO')) fase = 9 //PENDENTE
      if (proposta.CodFase != 10293 && getProposta.data.loan_track.current_activity_description.includes('REPROVA FGTS')) fase = 10293 //VERFICAÇÃO MANUAL OP
      if (proposta.CodFase != 10293 && getProposta.data.loan_track.current_activity_description.includes('REPROVA CREDITO')) fase = 10293 //VERFICAÇÃO MANUAL OP
      if (proposta.CodFase != 10293 && getProposta.data.loan_track.current_activity_description.includes('AJUSTAR MARGEM')) fase = 10293 //VERFICAÇÃO MANUAL OP
      if (proposta.CodFase != 2 && getProposta.data.loan_track.current_activity_description.includes('AVERBACAO')) fase = 2 //AGUARDANDO AVERBAÇÃO
      var faseName = false
      if (fase == 2) faseName = 'AGUARDANDO AVERBAÇÃO'
      if (fase == 9232) faseName = 'AGUARDANDO ASSINATURA DIGITAL'
      if (fase == 1111) faseName = 'AGUARDANDO ATUAÇÃO MASTER'
      if (fase == 692) faseName = 'PROPOSTA EM ANALISE BANCO'
      if (fase == 3920) faseName = 'PROPOSTA PAGA'
      if (fase == 4002) faseName = 'ASSINADO / RESPONDIDO'
      if (fase == 700) faseName = 'REPROVADO'
      if (fase == 9) faseName = 'PENDENTE'
      if (fase == 323) faseName = 'AGUARDA AUMENTO INSS'
      if (fase == 692) faseName = 'PROPOSTA EM ANALISE BANCO'
      if (fase == 10293) faseName = 'VERFICAÇÃO MANUAL OP'
      if (fase && faseName) {
        console.log(1)
        if ((fase == 3920 && proposta.CodFase == 2) || fase != 3) {
          console.log(2)
          if (fase == 9 && getProposta.data.loan_track.current_activity_description.includes('PEN DOCUMENTOS')) {
            console.log(3)
            await pool.request().input('fase',fase).input('contrato',proposta.NumeroContrato).input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco!\nMotivo: Enviar novo documento e avisar cliente de possível contato do banco`).input('bank',626).execute('pr_changeFase_by_contrato')
            console.log(`[C6 Esteira]=> Contrato: ${proposta.NumeroContrato} - FaseOLD: ${proposta.Fase} - FaseNew: ${faseName} - Motivo: Enviar novo documento e avisar cliente de possível contato do banco`)
          } else if (fase == 9 && getProposta.data.loan_track.current_activity_description.includes('AGUARDA AUTORIZACAO')) {
            console.log(4)
            await pool.request().input('fase',fase).input('contrato',proposta.NumeroContrato).input('texto',`[ESTEIRA]=> Fase alterada para a mesma que está no banco!\nMotivo: Cliente cancelou a autorização! O mesmo precisa gerar novamente para darmos andamento na operação`).input('bank',626).execute('pr_changeFase_by_contrato')
            console.log(`[C6 Esteira]=> Contrato: ${proposta.NumeroContrato} - FaseOLD: ${proposta.Fase} - FaseNew: ${faseName} - Motivo: Cliente cancelou a autorização! O mesmo precisa gerar novamente para darmos andamento na operação`)
          } else {
            console.log(5)
            await pool.request().input('fase',fase).input('contrato',proposta.NumeroContrato).input('texto','[ESTEIRA]=> Fase alterada para a mesma que está no banco!').input('bank',626).execute('pr_changeFase_by_contrato')
            console.log(`[C6 Esteira]=> Contrato: ${proposta.NumeroContrato} - FaseOLD: ${proposta.Fase} - FaseNew: ${faseName}`)
          }
        }
      } else {
        if (getProposta.data.loan_track.current_activity_description.includes('PAGO')) fase = 3 //PAGO AO CLIENTE
        if (getProposta.data.loan_track.current_activity_description.includes('AGUARDA FORM DIG WEB')) fase = 9232 //AGUARDANDO ASSINATURA DIGITAL
        if (getProposta.data.loan_track.current_activity_description.includes('ANALISE CORBAN')) fase = 1111 //AGUARDANDO ATUAÇÃO MASTER
        if (getProposta.data.loan_track.current_activity_description.includes('ANALISE DOCUMENTAL')) fase = 692 //PROPOSTA EM ANALISE BANCO
        if (getProposta.data.loan_track.current_activity_description.includes('MESA PREVENCAO')) fase = 692 //PROPOSTA EM ANALISE BANCO
        if (getProposta.data.loan_track.current_activity_description.includes('ANALISE SELFIE')) fase = 692 //PROPOSTA EM ANALISE BANCO
        if (getProposta.data.loan_track.current_activity_description.includes('PEN DOCUMENTOS')) fase = 9 //PENDENTE
        if (getProposta.data.loan_track.current_activity_description.includes('AGUARDA AUTORIZACAO')) fase = 9 //PENDENTE
        if (getProposta.data.loan_track.current_activity_description.includes('REPROVA FGTS')) fase = 10293 //VERFICAÇÃO MANUAL OP
        if (getProposta.data.loan_track.current_activity_description.includes('REPROVA CREDITO')) fase = 10293 //VERFICAÇÃO MANUAL OP
        if (getProposta.data.loan_track.current_activity_description.includes('AJUSTAR MARGEM')) fase = 10293 //VERFICAÇÃO MANUAL OP
        if (getProposta.data.loan_track.current_activity_description.includes('AVERBACAO')) fase = 2 //AGUARDANDO AVERBAÇÃO
        if (!fase) console.log(`[C6 Esteira CODE: ${proposta.NumeroContrato}]=> Nova fase: ${getProposta.data.loan_track.current_activity_description} - Status: ${getProposta.data.loan_track.situation}`)
      }
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(c6, pool)
    } else {
      console.log(2)
      if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
      return verifyFaseBank(c6, pool)
    }
  } else {
    console.log(1)
    if (queue.findIndex(r=>r.codigo == proposta.NumeroContrato) >= 0) await queue.splice(queue.findIndex(r=>r.codigo == proposta.NumeroContrato), 1)
    return verifyFaseBank(c6, pool)
  }
}

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }