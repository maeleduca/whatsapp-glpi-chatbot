const axios = require('axios');

class GLPIService {
    constructor() {
        this.baseURL = process.env.GLPI_URL;
        this.appToken = process.env.GLPI_APP_TOKEN;
        this.userToken = process.env.GLPI_USER_TOKEN;
    }

    async initSession() {
        try {
            const response = await axios.get(`${this.baseURL}/initSession`, {
                headers: {
                    'Authorization': `user_token ${this.userToken}`,
                    'App-Token': this.appToken
                }
            });
            return response.data.session_token;
        } catch (error) {
            console.error('GLPI authentication error:', error);
            throw error;
        }
    }

    async killSession(sessionToken) {
        try {
            await axios.get(`${this.baseURL}/killSession`, {
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken
                }
            });
        } catch (error) {
            console.error('Error killing session:', error);
        }
    }

    async createTicket(sessionToken, data) {
        try {
            const response = await axios.post(`${this.baseURL}/Ticket`, {
                ...data,
                input_type: 'whatsapp'
            }, {
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }

    async updateUserPhone(sessionToken, userId, phoneNumber) {
        try {
            const response = await axios.put(`${this.baseURL}/User/${userId}`, {
                mobile: phoneNumber
            }, {
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating user phone:', error);
            throw error;
        }
    }

    async searchUser(sessionToken, email) {
        try {
            const response = await axios.get(`${this.baseURL}/search/User`, {
                params: {
                    criteria: [
                        {
                            field: 'email',
                            searchtype: 'equals',
                            value: email
                        }
                    ]
                },
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': this.appToken
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching user:', error);
            throw error;
        }
    }
}

module.exports = new GLPIService();