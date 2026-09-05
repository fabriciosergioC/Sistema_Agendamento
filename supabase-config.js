// Configuração e Conexão com o Supabase
// Substitua as constantes abaixo pelas credenciais do seu projeto Supabase (Project Settings -> API)
const SUPABASE_URL = 'https://ulyyzfqbtdyxaszdzbvl.supabase.co'; // Exemplo: 'https://xxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVseXl6ZnFidGR5eGFzemR6YnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTIyMjIsImV4cCI6MjA4ODU2ODIyMn0.Cq5rC04XD62MzrHUyMdaZ9Ef1UEPgpwXRMdrlOd0u8U'; // Exemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ [Supabase] Conectado ao banco de dados em nuvem!');
    } catch (e) {
        console.error('⚠️ [Supabase] Erro ao inicializar cliente Supabase:', e);
    }
} else {
    console.warn('ℹ️ [Supabase] Credenciais não configuradas. Usando localStorage como fallback.');
}

// Função auxiliar para mostrar erros do Supabase de forma visível
function _showSupabaseError(operacao, err) {
    const msg = err?.message || JSON.stringify(err);
    const details = err?.details || '';
    const hint = err?.hint || '';
    console.error(`❌ [Supabase] Erro em "${operacao}":`, err);
    console.error(`   Mensagem: ${msg}`);
    if (details) console.error(`   Detalhes: ${details}`);
    if (hint)    console.error(`   Dica: ${hint}`);
    // Alerta visível apenas em modo debug (remova se não quiser)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        alert(`❌ Erro Supabase (${operacao}):\n${msg}\n${details}\n${hint}`);
    }
}

window.dbService = {
    isSupabaseActive() {
        return !!supabaseClient;
    },

    // --- AGENDAMENTOS ---
    async getAppointments() {
        if (this.isSupabaseActive()) {
            try {
                console.log('🔄 [Supabase] Buscando agendamentos...');
                const { data, error } = await supabaseClient
                    .from('appointments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    _showSupabaseError('getAppointments', error);
                    // Fallback para localStorage
                    return JSON.parse(localStorage.getItem('appointments')) || [];
                }
                console.log(`✅ [Supabase] ${data?.length || 0} agendamentos carregados.`);
                return data || [];
            } catch (err) {
                _showSupabaseError('getAppointments (catch)', err);
            }
        }
        console.log('ℹ️ [dbService] Usando localStorage para agendamentos.');
        return JSON.parse(localStorage.getItem('appointments')) || [];
    },

    async addAppointment(appointment) {
        if (this.isSupabaseActive()) {
            try {
                // Garantir que date está no formato correto YYYY-MM-DD
                const payload = {
                    id: appointment.id,
                    name: appointment.name,
                    email: appointment.email || null,
                    phone: appointment.phone || null,
                    date: appointment.date, // deve ser YYYY-MM-DD
                    time: appointment.time,
                    service: appointment.service,
                    notes: appointment.notes || null,
                    status: appointment.status || 'pending'
                    // created_at é gerado automaticamente pelo banco (DEFAULT NOW())
                };

                console.log('🔄 [Supabase] Salvando agendamento:', payload);

                const { data, error } = await supabaseClient
                    .from('appointments')
                    .insert([payload])
                    .select();

                if (error) {
                    _showSupabaseError('addAppointment', error);
                    // Salva localmente como fallback
                    const local = JSON.parse(localStorage.getItem('appointments')) || [];
                    local.unshift(appointment);
                    localStorage.setItem('appointments', JSON.stringify(local));
                    return appointment;
                }

                console.log('✅ [Supabase] Agendamento salvo com sucesso!', data?.[0]);
                // Cópia local para redundância
                const local = JSON.parse(localStorage.getItem('appointments')) || [];
                local.unshift(data?.[0] || appointment);
                localStorage.setItem('appointments', JSON.stringify(local));
                return data ? data[0] : appointment;
            } catch (err) {
                _showSupabaseError('addAppointment (catch)', err);
                // Fallback
                const local = JSON.parse(localStorage.getItem('appointments')) || [];
                local.unshift(appointment);
                localStorage.setItem('appointments', JSON.stringify(local));
                return appointment;
            }
        }
        console.log('ℹ️ [dbService] Salvando agendamento no localStorage.');
        const local = JSON.parse(localStorage.getItem('appointments')) || [];
        local.unshift(appointment);
        localStorage.setItem('appointments', JSON.stringify(local));
        return appointment;
    },

    async updateAppointment(id, updatedFields) {
        if (this.isSupabaseActive()) {
            try {
                // Remover campos que não devem ir no update
                const { id: _id, created_at: _ca, createdAt: _ca2, ...fieldsToUpdate } = updatedFields;
                console.log('🔄 [Supabase] Atualizando agendamento id:', id, fieldsToUpdate);

                const { error } = await supabaseClient
                    .from('appointments')
                    .update(fieldsToUpdate)
                    .eq('id', id);

                if (error) {
                    _showSupabaseError('updateAppointment', error);
                } else {
                    console.log('✅ [Supabase] Agendamento atualizado!');
                }
            } catch (err) {
                _showSupabaseError('updateAppointment (catch)', err);
            }
        }
        const local = JSON.parse(localStorage.getItem('appointments')) || [];
        const index = local.findIndex(a => a.id === id);
        if (index !== -1) {
            local[index] = { ...local[index], ...updatedFields };
            localStorage.setItem('appointments', JSON.stringify(local));
        }
    },

    async deleteAppointment(id) {
        if (this.isSupabaseActive()) {
            try {
                console.log('🔄 [Supabase] Deletando agendamento id:', id);
                const { error } = await supabaseClient
                    .from('appointments')
                    .delete()
                    .eq('id', id);

                if (error) {
                    _showSupabaseError('deleteAppointment', error);
                } else {
                    console.log('✅ [Supabase] Agendamento deletado!');
                }
            } catch (err) {
                _showSupabaseError('deleteAppointment (catch)', err);
            }
        }
        let local = JSON.parse(localStorage.getItem('appointments')) || [];
        local = local.filter(a => a.id !== id);
        localStorage.setItem('appointments', JSON.stringify(local));
    },

    // --- ADMINISTRADORES ---
    async getAdmins() {
        if (this.isSupabaseActive()) {
            try {
                const { data, error } = await supabaseClient
                    .from('admins')
                    .select('*');

                if (error) {
                    _showSupabaseError('getAdmins', error);
                } else if (data && data.length > 0) {
                    return data;
                }
            } catch (err) {
                _showSupabaseError('getAdmins (catch)', err);
            }
        }
        const local = localStorage.getItem('admins');
        return local ? JSON.parse(local) : [{ username: 'admin', password: 'admin123' }];
    },

    async validateAdmin(username, password) {
        if (this.isSupabaseActive()) {
            try {
                const { data, error } = await supabaseClient
                    .from('admins')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .maybeSingle();

                if (error) {
                    _showSupabaseError('validateAdmin', error);
                } else {
                    return !!data;
                }
            } catch (err) {
                _showSupabaseError('validateAdmin (catch)', err);
            }
        }
        const admins = await this.getAdmins();
        return admins.some(a => a.username === username && a.password === password);
    },

    async addAdmin(username, password) {
        if (this.isSupabaseActive()) {
            try {
                const { error } = await supabaseClient
                    .from('admins')
                    .insert([{ username, password }]);

                if (error) {
                    if (error.code === '23505') {
                        return { success: false, message: 'Nome de usuário já existe!' };
                    }
                    _showSupabaseError('addAdmin', error);
                    return { success: false, message: error.message || 'Erro ao salvar no banco' };
                }
                return { success: true };
            } catch (err) {
                _showSupabaseError('addAdmin (catch)', err);
                return { success: false, message: err.message || 'Erro desconhecido' };
            }
        }
        const admins = await this.getAdmins();
        if (admins.some(a => a.username === username)) {
            return { success: false, message: 'Nome de usuário já existe!' };
        }
        admins.push({ username, password });
        localStorage.setItem('admins', JSON.stringify(admins));
        return { success: true };
    },

    async removeAdmin(username) {
        if (this.isSupabaseActive()) {
            try {
                const { error } = await supabaseClient
                    .from('admins')
                    .delete()
                    .eq('username', username);

                if (error) _showSupabaseError('removeAdmin', error);
            } catch (err) {
                _showSupabaseError('removeAdmin (catch)', err);
            }
        }
        let admins = await this.getAdmins();
        admins = admins.filter(a => a.username !== username);
        localStorage.setItem('admins', JSON.stringify(admins));
    }
};
