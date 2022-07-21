const axios = require('axios');

class Panamericano {
  constructor() {
    this.url = "https://api.bancopan.com.br/"//SEM LOGIN - https://sandbox.bancopan.com.br
    this.client = process.env.PAN_CLIENT_ID
    this.secret = process.env.PAN_CLIENT_SECRET
    this.auth = process.env.PAN_AUTH
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      const response = await axios.post(`${this.url}consignado/v0/tokens`, { username: `${process.env.PAN_CPF}_${process.env.PAN_PROMOTER_CODE}`, password: process.env.PAN_PASSWORD, grant_type: 'client_credentials+password' }, { headers: { Authorization: `Basic ${this.auth}`, ApiKey: this.client }});
      if (response.data && response.data.token) {
        this.token = response.data.token
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `Bearer ${this.token}`, ApiKey: this.client } });
        return true;
      } else if (response) {
        console.log(`[API Pan TOKEN - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=>`)
        console.log(response.data ? response.data : response);
        return false
      } else return false
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API Pan ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async simularProposta(data, log) {
    try {
      if (!this.api) {
        await this.refreshToken(log);
        return simularProposta(data, log)
      }
      log.situation = `[2]=> Simulando a proposta...`
      const response = await this.api.post(`openapi/consignado/v2/emprestimos/simulacao/fgts`, data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      console.log(`[API Pan ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async simularPropostaINSS(data, log) {
    try {
      log.situation = `[2]=> Simulando a proposta...`
      const response = await this.api.post(`openapi/consignado/v1/emprestimos/simulacao`, data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaINSS(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaINSS(data, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaINSS(data, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaINSS(data, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaINSS(data, log)
      }
      console.log(`[API Pan ERROR(5) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async registerProposta(data, log) {
    try {
      log.situation = `[3]=> Registrando a proposta...`
      const response = await this.api.post(`openapi/consignado/v1/emprestimos/propostas/fgts`, data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      console.log(`[API Pan ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async registerPropostaINSS(data, log) {
    try {
      log.situation = `[3]=> Registrando a proposta...`
      const response = await this.api.post(`openapi/consignado/v1/emprestimos/propostas`, data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerPropostaINSS(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerPropostaINSS(data, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerPropostaINSS(data, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerPropostaINSS(data, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerPropostaINSS(data, log)
      }
      console.log(`[API Pan ERROR(6) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async getLink(cpf, numeroProposta, log) {
    try {
      log.situation = `[4]=> Aguardando liberação na esteira...`
      const response = await this.api.get(`consignado/v0/formalizador/${process.env.PAN_PROMOTER_CODE}/${cpf}/${numeroProposta}/links`);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(id, tipoProposta, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(id, tipoProposta, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(id, tipoProposta, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(data, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(data, log)
      }
      console.log(`[API Pan ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
  async getContrato(cpf, log) {
    try {
      log.situation = `[4]=> Aguardando liberação na esteira...`
      const response = await this.api.get(`consignado/v0/emprestimos/propostas/cpf?cpf_cliente=${cpf}&codigo_promotora=${process.env.PAN_PROMOTER_CODE}`);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.detalhes && err.response.data.detalhes[0]) return err.response
      if(err.response && (err.response.status == 401 || err.response.status == 504 || err.response.status == 502)) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getContrato(cpf, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getContrato(cpf, log)
      }
      if (err.response && err.response.data && err.response.data.mensagem == "Limite de requisições excedidas") {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getContrato(cpf, log)
      }
      if (err.response && err.response.data && (err.response.data.detalhes.includes('Tente novamente mais tarde') || err.response.data.detalhes.includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getContrato(cpf, log)
      }
      if (err.response && err.response.data && err.response.data.detalhes && (err.response.data.detalhes[0].includes('Tente novamente mais tarde') || err.response.data.detalhes[0].includes('Não houve resposta no retorno da chamada'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getContrato(cpf, log)
      }
      console.log(`[API Pan ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response
    }
  }
}

module.exports = Panamericano