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
    console.warn('ℹ️ [Supabase] Credenciais do Supabase não configuradas em `supabase-config.js`. Utilizando localStorage como fallback.');
}

window.dbService = {
    isSupabaseActive() {
        return !!supabaseClient;
    },

    // --- AGENDAMENTOS ---
    async getAppointments() {
        if (this.isSupabaseActive()) {
            try {
                const { data, error } = await supabaseClient
                    .from('appointments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('Erro Supabase (getAppointments):', err);
            }
        }
        return JSON.parse(localStorage.getItem('appointments')) || [];
    },

    async addAppointment(appointment) {
        if (this.isSupabaseActive()) {
            try {
                const { data, error } = await supabaseClient
                    .from('appointments')
                    .insert([appointment])
                    .select();

                if (error) throw error;

                // Manter cópia local para redundância
                const local = JSON.parse(localStorage.getItem('appointments')) || [];
                local.unshift(appointment);
                localStorage.setItem('appointments', JSON.stringify(local));

                return data ? data[0] : appointment;
            } catch (err) {
                console.error('Erro Supabase (addAppointment):', err);
            }
        }
        const local = JSON.parse(localStorage.getItem('appointments')) || [];
        local.unshift(appointment);
        localStorage.setItem('appointments', JSON.stringify(local));
        return appointment;
    },

    async updateAppointment(id, updatedFields) {
        if (this.isSupabaseActive()) {
            try {
                const { error } = await supabaseClient
                    .from('appointments')
                    .update(updatedFields)
                    .eq('id', id);

                if (error) throw error;
            } catch (err) {
                console.error('Erro Supabase (updateAppointment):', err);
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
                const { error } = await supabaseClient
                    .from('appointments')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } catch (err) {
                console.error('Erro Supabase (deleteAppointment):', err);
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

                if (error) throw error;
                if (data && data.length > 0) return data;
            } catch (err) {
                console.error('Erro Supabase (getAdmins):', err);
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

                if (error) throw error;
                return !!data;
            } catch (err) {
                console.error('Erro Supabase (validateAdmin):', err);
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
                    if (error.code === '23505') { // unique_violation
                        return { success: false, message: 'Nome de usuário já existe!' };
                    }
                    throw error;
                }
                return { success: true };
            } catch (err) {
                console.error('Erro Supabase (addAdmin):', err);
                return { success: false, message: err.message || 'Erro ao salvar no banco' };
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

                if (error) throw error;
            } catch (err) {
                console.error('Erro Supabase (removeAdmin):', err);
            }
        }
        let admins = await this.getAdmins();
        admins = admins.filter(a => a.username !== username);
        localStorage.setItem('admins', JSON.stringify(admins));
    }
};
