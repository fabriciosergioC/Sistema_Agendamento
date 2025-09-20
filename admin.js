// Sistema de Administração para Agendamentos
class AdminSystem {
    constructor() {
        this.appointments = [];
        this.admins = [];
        this.currentUser = localStorage.getItem('currentUser') || 'admin';
        this.timeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ];
        this.currentFilters = {
            date: '',
            service: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.loadAppointments();
        this.loadAdmins();
        this.setupEventListeners();
        this.updateStats();
        this.setMinDate();
        // Aplicar filtro padrão de agendamentos pendentes
        this.setQuickFilter('pending');
        
        // Renderizar lista de administradores se o modal estiver visível
        if (document.getElementById('adminsModal') && 
            document.getElementById('adminsModal').style.display === 'block') {
            this.renderAdminsList();
        }
    }

    setupEventListeners() {
        // Filtros rápidos
        document.getElementById('filterPending').addEventListener('click', () => {
            this.setQuickFilter('pending');
        });

        document.getElementById('filterToday').addEventListener('click', () => {
            this.setQuickFilter('today');
        });

        document.getElementById('filterWeek').addEventListener('click', () => {
            this.setQuickFilter('week');
        });

        document.getElementById('filterAll').addEventListener('click', () => {
            this.setQuickFilter('all');
        });

        // Filtros
        document.getElementById('filterDate').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterService').addEventListener('change', (e) => {
            this.currentFilters.service = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchTerm').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Exportação
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Gerenciamento de administradores
        document.getElementById('manageAdminsBtn').addEventListener('click', () => {
            this.openAdminsModal();
        });

        document.getElementById('addAdminBtn').addEventListener('click', () => {
            this.handleAddAdmin();
        });

        // Modal
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeEditModal();
                this.closeDeleteModal();
                this.closeAdminsModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeEditModal();
                this.closeDeleteModal();
                this.closeAdminsModal();
            }
        });

        // Formulário de edição
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAppointment();
        });

        // Seleção de data no formulário de edição
        document.getElementById('editDate').addEventListener('change', (e) => {
            this.updateAvailableTimesForEdit(e.target.value);
        });
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDate').min = today;
        document.getElementById('editDate').min = today;
    }

    populateTimeSelects() {
        // Não é mais necessário pois usamos slots de horário em vez de select
    }

    loadAppointments() {
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            // Filtrar agendamentos com dados válidos
            this.appointments = appointments.filter(app => {
                return app && 
                       typeof app === 'object' && 
                       app.id && 
                       (app.name || app.email || app.phone); // Pelo menos um campo deve estar preenchido
            });
            
            // Se encontramos agendamentos inválidos, salvar a lista limpa
            if (this.appointments.length !== appointments.length) {
                this.saveAppointments();
                this.showNotification('Alguns agendamentos com dados inválidos foram removidos.', 'warning');
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.appointments = [];
            this.showNotification('Erro ao carregar agendamentos. Lista foi resetada.', 'error');
        }
    }

    loadAdmins() {
        this.admins = JSON.parse(localStorage.getItem('admins')) || [{ username: 'admin', password: 'admin123' }];
    }

    saveAdmins() {
        localStorage.setItem('admins', JSON.stringify(this.admins));
    }

    addAdmin(username, password) {
        // Verificar se o usuário já existe
        if (this.admins.some(admin => admin.username === username)) {
            this.showNotification('Erro: Usuário já existe!', 'error');
            return false;
        }

        this.admins.push({ username, password });
        this.saveAdmins();
        this.renderAdminsList();
        this.showNotification('Administrador adicionado com sucesso!', 'success');
        return true;
    }

    removeAdmin(username) {
        // Não permitir remover o próprio usuário
        if (username === this.currentUser) {
            this.showNotification('Você não pode remover seu próprio usuário!', 'error');
            return;
        }

        // Não permitir remover o último administrador
        if (this.admins.length <= 1) {
            this.showNotification('Não é possível remover o último administrador!', 'error');
            return;
        }

        this.admins = this.admins.filter(admin => admin.username !== username);
        this.saveAdmins();
        this.renderAdminsList();
        this.showNotification('Administrador removido com sucesso!', 'success');
    }

    renderAdminsList() {
        const adminsList = document.getElementById('adminsList');
        if (!adminsList) return;

        adminsList.innerHTML = this.admins.map(admin => `
            <div class="admin-item">
                <span class="admin-username">${admin.username} ${admin.username === this.currentUser ? '<span class="current-user">(Você)</span>' : ''}</span>
                ${this.admins.length > 1 && admin.username !== this.currentUser ? 
                    `<button class="btn-remove-admin" onclick="adminSystem.removeAdmin('${admin.username}')">
                        <i class="fas fa-trash"></i> Remover
                    </button>` : ''}
            </div>
        `).join('');
    }

    applyFilters() {
        let filteredAppointments = [...this.appointments];

        // Filtro por data
        if (this.currentFilters.date) {
            filteredAppointments = filteredAppointments.filter(app => 
                app.date === this.currentFilters.date
            );
        }

        // Filtro por serviço
        if (this.currentFilters.service) {
            filteredAppointments = filteredAppointments.filter(app => 
                app.service === this.currentFilters.service
            );
        }

        // Filtro por busca
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filteredAppointments = filteredAppointments.filter(app => 
                app.name.toLowerCase().includes(searchTerm) ||
                app.email.toLowerCase().includes(searchTerm) ||
                app.phone.includes(searchTerm)
            );
        }

        // Se algum filtro manual foi aplicado, remover classe active dos filtros rápidos
        if (this.currentFilters.date || this.currentFilters.service || this.currentFilters.search) {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }

        this.renderAppointments(filteredAppointments);
    }

    setQuickFilter(filterType) {
        // Remover classe active de todos os botões
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar classe active ao botão clicado
        document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).classList.add('active');
        
        // Aplicar filtro baseado no tipo
        let filteredAppointments = [...this.appointments];
        const today = new Date().toISOString().split('T')[0];
        
        switch(filterType) {
            case 'pending':
                // Agendamentos futuros (incluindo hoje)
                filteredAppointments = filteredAppointments.filter(app => app.date >= today);
                break;
            case 'today':
                // Apenas agendamentos de hoje
                filteredAppointments = filteredAppointments.filter(app => app.date === today);
                break;
            case 'week':
                // Agendamentos desta semana
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                const weekEnd = weekFromNow.toISOString().split('T')[0];
                filteredAppointments = filteredAppointments.filter(app => 
                    app.date >= today && app.date <= weekEnd
                );
                break;
            case 'all':
                // Todos os agendamentos
                filteredAppointments = [...this.appointments];
                break;
        }
        
        // Limpar filtros manuais
        this.currentFilters = { date: '', service: '', search: '' };
        document.getElementById('filterDate').value = '';
        document.getElementById('filterService').value = '';
        document.getElementById('searchTerm').value = '';
        
        // Renderizar agendamentos filtrados
        this.renderAppointments(filteredAppointments);
    }

    clearFilters() {
        this.currentFilters = { date: '', service: '', search: '' };
        document.getElementById('filterDate').value = '';
        document.getElementById('filterService').value = '';
        document.getElementById('searchTerm').value = '';
        
        // Resetar filtro rápido para "Pendentes"
        this.setQuickFilter('pending');
    }

    updateStats() {
        const total = this.appointments.length;
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.appointments.filter(app => app.date === today).length;
        const upcomingCount = this.appointments.filter(app => app.date > today).length;

        document.getElementById('totalAppointments').textContent = total;
        document.getElementById('todayAppointments').textContent = todayCount;
        document.getElementById('upcomingAppointments').textContent = upcomingCount;
    }

    renderAppointments(appointmentsToRender = null) {
        const appointmentsList = document.getElementById('appointmentsList');
        const appointments = appointmentsToRender || this.appointments;
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p class="no-appointments">Nenhum agendamento encontrado.</p>';
            return;
        }

        // Ordenar por data e hora
        const sortedAppointments = appointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });

        appointmentsList.innerHTML = sortedAppointments.map(appointment => `
            <div class="appointment-item">
                <div class="appointment-header">
                    <div class="appointment-info">
                        <span class="appointment-name">${appointment.name || 'Nome não informado'}</span>
                        <span class="appointment-service">${this.getServiceLabel(appointment.service || 'outro')}</span>
                    </div>
                    <div class="appointment-time-info">
                        <span class="appointment-date">${this.formatDate(appointment.date || new Date().toISOString().split('T')[0])}</span>
                        <span class="appointment-time">${appointment.time || 'Horário não definido'}</span>
                    </div>
                </div>
                <div class="appointment-details">
                    <div class="contact-info">
                        <p><i class="fas fa-envelope"></i> ${appointment.email || 'Email não informado'}</p>
                        <p><i class="fas fa-phone"></i> ${appointment.phone || 'Telefone não informado'}</p>
                    </div>
                    ${appointment.notes ? `<p class="notes"><i class="fas fa-sticky-note"></i> <strong>Observações:</strong> ${appointment.notes}</p>` : ''}
                    <p class="created-at"><i class="fas fa-calendar-plus"></i> <strong>Criado em:</strong> ${this.formatDateTime(appointment.createdAt || new Date().toISOString())}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn-edit" onclick="adminSystem.editAppointment('${appointment.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="adminSystem.showDeleteModal('${appointment.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    editAppointment(id) {
        const appointment = this.appointments.find(app => app.id === id);
        if (appointment) {
            document.getElementById('editId').value = appointment.id || '';
            document.getElementById('editName').value = appointment.name || '';
            document.getElementById('editEmail').value = appointment.email || '';
            document.getElementById('editPhone').value = appointment.phone || '';
            document.getElementById('editDate').value = appointment.date || '';
            document.getElementById('editTime').value = appointment.time || '';
            document.getElementById('editService').value = appointment.service || '';
            document.getElementById('editNotes').value = appointment.notes || '';
            
            // Resetar mensagem de erro
            document.getElementById('editTimeError').style.display = 'none';
            
            this.updateAvailableTimesForEdit(appointment.date || '');
            document.getElementById('editModal').style.display = 'block';
        }
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        // Resetar seleção de slots de horário
        document.querySelectorAll('#editTimeSlots .time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        // Resetar mensagem de erro
        document.getElementById('editTimeError').style.display = 'none';
    }

    showDeleteModal(id) {
        const appointment = this.appointments.find(app => app.id === id);
        if (appointment) {
            document.getElementById('deleteDetails').textContent = 
                `${appointment.name} - ${this.formatDate(appointment.date)} às ${appointment.time} (${this.getServiceLabel(appointment.service)})`;
            
            document.getElementById('confirmDelete').onclick = () => {
                this.deleteAppointment(id);
            };
            
            document.getElementById('deleteModal').style.display = 'block';
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
    }

    openAdminsModal() {
        document.getElementById('adminsModal').style.display = 'block';
        this.renderAdminsList();
        
        // Limpar campos do formulário
        document.getElementById('newAdminUsername').value = '';
        document.getElementById('newAdminPassword').value = '';
        document.getElementById('confirmAdminPassword').value = '';
    }

    closeAdminsModal() {
        document.getElementById('adminsModal').style.display = 'none';
    }

    handleAddAdmin() {
        const username = document.getElementById('newAdminUsername').value.trim();
        const password = document.getElementById('newAdminPassword').value;
        const confirmPassword = document.getElementById('confirmAdminPassword').value;

        if (!username || !password) {
            this.showNotification('Por favor, preencha todos os campos!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('As senhas não coincidem!', 'error');
            return;
        }

        this.addAdmin(username, password);
        
        // Limpar campos após adicionar
        document.getElementById('newAdminUsername').value = '';
        document.getElementById('newAdminPassword').value = '';
        document.getElementById('confirmAdminPassword').value = '';
    }

    updateAppointment() {
        const appointmentId = document.getElementById('editId').value;
        const selectedTime = document.getElementById('editTime').value;
        
        // Verificar se um horário foi selecionado
        if (!selectedTime) {
            document.getElementById('editTimeError').style.display = 'block';
            this.showNotification('Por favor, selecione um horário no painel abaixo.', 'error');
            return;
        }
        
        // Obter valores dos campos do formulário
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const date = document.getElementById('editDate').value;
        const service = document.getElementById('editService').value;
        const notes = document.getElementById('editNotes').value.trim();
        
        // Validar campos obrigatórios
        if (!name) {
            this.showNotification('O nome é obrigatório.', 'error');
            document.getElementById('editName').focus();
            return;
        }
        
        if (!email) {
            this.showNotification('O email é obrigatório.', 'error');
            document.getElementById('editEmail').focus();
            return;
        }
        
        if (!phone) {
            this.showNotification('O telefone é obrigatório.', 'error');
            document.getElementById('editPhone').focus();
            return;
        }
        
        if (!date) {
            this.showNotification('A data é obrigatória.', 'error');
            document.getElementById('editDate').focus();
            return;
        }
        
        if (!service) {
            this.showNotification('O serviço é obrigatório.', 'error');
            document.getElementById('editService').focus();
            return;
        }
        
        const updatedAppointment = {
            id: appointmentId,
            name: name,
            email: email,
            phone: phone,
            date: date,
            time: selectedTime,
            service: service,
            notes: notes,
            createdAt: this.appointments.find(app => app.id === appointmentId)?.createdAt || new Date().toISOString()
        };

        console.log('updateAppointment - Dados coletados:', {
            appointmentId,
            name,
            email,
            phone,
            date,
            selectedTime,
            service
        });
        
        // Verificar se o horário já está ocupado por outro agendamento
        const conflictingAppointment = this.appointments.find(app => {
            const dateMatch = app.date === date;
            const timeMatch = app.time === selectedTime;
            const differentId = app.id !== appointmentId;
            
            console.log('Verificando conflito com agendamento:', {
                appointmentName: app.name,
                appointmentId: app.id,
                appointmentDate: app.date,
                appointmentTime: app.time,
                dateMatch,
                timeMatch,
                differentId,
                isConflict: dateMatch && timeMatch && differentId
            });
            
            return dateMatch && timeMatch && differentId;
        });
        
        console.log('Resultado da verificação de conflito:', conflictingAppointment);

        if (conflictingAppointment) {
            console.log('CONFLITO DETECTADO!');
            this.showNotification(
                `Este horário já está ocupado por ${conflictingAppointment.name || 'outro agendamento'}. Por favor, selecione outro horário.`, 
                'error'
            );
            // Atualizar os slots para mostrar o conflito
            this.updateAvailableTimesForEdit(date);
            return;
        }

        const index = this.appointments.findIndex(app => app.id === appointmentId);
        if (index !== -1) {
            this.appointments[index] = updatedAppointment;
            this.saveAppointments();
            this.renderAppointments();
            this.updateStats();
            this.closeEditModal();
            this.showNotification('Agendamento atualizado com sucesso!', 'success');
        } else {
            this.showNotification('Erro: Agendamento não encontrado.', 'error');
        }
    }

    deleteAppointment(id) {
        this.appointments = this.appointments.filter(app => app.id !== id);
        this.saveAppointments();
        this.renderAppointments();
        this.updateStats();
        this.closeDeleteModal();
        this.showNotification('Agendamento excluído com sucesso!', 'success');
    }

    updateAvailableTimesForEdit(selectedDate) {
        const editTimeInput = document.getElementById('editTime');
        const editTimeSlotsContainer = document.getElementById('editTimeSlots');
        const currentAppointmentId = document.getElementById('editId').value;
        
        console.log('updateAvailableTimesForEdit - selectedDate:', selectedDate);
        console.log('updateAvailableTimesForEdit - currentAppointmentId:', currentAppointmentId);
        console.log('updateAvailableTimesForEdit - todos os agendamentos:', this.appointments);
        
        // Limpar slots existentes
        editTimeSlotsContainer.innerHTML = '';
        
        // Criar slots de horário
        this.timeSlots.forEach(time => {
            // Verificar se o horário está ocupado por outro agendamento (exceto o atual sendo editado)
            const conflictingAppointments = this.appointments.filter(app => {
                const dateMatch = app.date === selectedDate;
                const timeMatch = app.time === time;
                const notCurrentAppointment = app.id !== currentAppointmentId;
                
                console.log(`Verificando conflito para ${time}:`, {
                    appointment: app.name,
                    id: app.id,
                    date: app.date,
                    time: app.time,
                    dateMatch,
                    timeMatch,
                    notCurrentAppointment,
                    isConflict: dateMatch && timeMatch && notCurrentAppointment
                });
                
                return dateMatch && timeMatch && notCurrentAppointment;
            });
            
            const isBooked = conflictingAppointments.length > 0;
            
            if (isBooked) {
                console.log(`Horário ${time} está OCUPADO por:`, conflictingAppointments);
            }
            
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.time = time;
            slot.textContent = time;
            
            if (isBooked) {
                // Horário ocupado - não clicável
                slot.classList.add('booked');
                slot.style.cursor = 'not-allowed';
                slot.title = `Horário ocupado por ${conflictingAppointments[0].name}`;
            } else {
                // Horário disponível - clicável
                slot.classList.add('available');
                slot.style.cursor = 'pointer';
                slot.title = 'Clique para selecionar';
                
                // Adicionar evento de clique apenas para slots disponíveis
                slot.addEventListener('click', (e) => {
                    // Verificar novamente se o slot ainda está disponível
                    if (!e.target.classList.contains('booked')) {
                        // Remover seleção anterior
                        document.querySelectorAll('#editTimeSlots .time-slot').forEach(s => {
                            s.classList.remove('selected');
                        });
                        
                        // Adicionar seleção ao slot clicado
                        e.target.classList.add('selected');
                        
                        // Atualizar campo de horário no formulário
                        document.getElementById('editTime').value = time;
                        
                        // Ocultar mensagem de erro, se estiver visível
                        document.getElementById('editTimeError').style.display = 'none';
                    } else {
                        // Mostrar notificação se tentar clicar em horário ocupado
                        this.showNotification('Este horário já está ocupado por outro agendamento.', 'error');
                    }
                });
            }
            
            editTimeSlotsContainer.appendChild(slot);
        });
        
        // Se estiver editando um agendamento existente, selecionar o horário atual
        const currentAppointment = this.appointments.find(app => app.id === currentAppointmentId);
        if (currentAppointment) {
            console.log('Agendamento atual encontrado:', currentAppointment);
            if (currentAppointment.date === selectedDate) {
                const slotToSelect = editTimeSlotsContainer.querySelector(`.time-slot[data-time="${currentAppointment.time}"]`);
                if (slotToSelect) {
                    slotToSelect.classList.add('selected');
                    // Garantir que o horário atual sempre esteja disponível para reselecionar
                    slotToSelect.classList.remove('booked');
                    slotToSelect.classList.add('available');
                    slotToSelect.style.cursor = 'pointer';
                }
            }
        } else {
            console.log('ERRO: Agendamento atual não encontrado para ID:', currentAppointmentId);
        }
    }

    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    exportToCSV() {
        const headers = ['Nome', 'Email', 'Telefone', 'Data', 'Horário', 'Serviço', 'Observações', 'Data de Criação'];
        const csvContent = [
            headers.join(','),
            ...this.appointments.map(app => [
                `"${app.name}"`,
                `"${app.email}"`,
                `"${app.phone}"`,
                app.date,
                app.time,
                `"${this.getServiceLabel(app.service)}"`,
                `"${app.notes || ''}"`,
                app.createdAt
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showNotification('Arquivo CSV exportado com sucesso!', 'success');
    }

    

    logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            // Remover status de autenticação
            localStorage.removeItem('adminAuthenticated');
            // Redirecionar para a página de login
            window.location.href = 'login.html';
        }
    }

    formatDate(dateString) {
        // Verificar se o valor é null, undefined ou string vazia
        if (!dateString || dateString === 'null' || dateString === 'undefined') {
            return 'Data não informada';
        }
        
        // Verificar se a data está no formato ISO (YYYY-MM-DD)
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            // Separar os componentes da data
            const [year, month, day] = dateString.split('-');
            // Retornar no formato DD/MM/YYYY
            return `${day}/${month}/${year}`;
        }
        
        // Se a data já estiver no formato DD/MM/YYYY, retornamos como está
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }
        
        // Caso contrário, tentamos formatar como Date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Se a data for inválida, retornamos uma mensagem padrão
            return 'Data inválida';
        }
        
        return date.toLocaleDateString('pt-BR');
    }

    formatDateTime(dateTimeString) {
        // Verificar se o valor é null, undefined ou string vazia
        if (!dateTimeString || dateTimeString === 'null' || dateTimeString === 'undefined') {
            return 'Data não informada';
        }
        
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            return 'Data inválida';
        }
        
        return date.toLocaleString('pt-BR');
    }

    getServiceLabel(service) {
        const serviceLabels = {
            'corte': 'Corte de Cabelo',
            'coloracao': 'Coloração',
            'manicure': 'Manicure',
            'pedicure': 'Pedicure',
            'depilacao': 'Depilação',
            'massagem': 'Massagem',
            'outro': 'Outro'
        };
        return serviceLabels[service] || service;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 15px;
            right: 15px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            font-size: 0.9rem;
        `;
        
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
}

// Adicionar estilos CSS para notificações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }
    
    .no-appointments {
        text-align: center;
        color: #718096;
        font-style: italic;
        padding: 16px;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(notificationStyles);

// Inicializar o sistema administrativo
const adminSystem = new AdminSystem();
