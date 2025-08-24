// Sistema de Agendamento
class AppointmentSystem {
    constructor() {
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.timeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateTimeSelects();
        this.updateTimeSlots();
        this.setMinDate();
    }

    setupEventListeners() {
        // Formulário de agendamento
        document.getElementById('appointmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAppointment();
        });

        // Seleção de data no formulário principal
        document.getElementById('date').addEventListener('change', (e) => {
            this.updateAvailableTimes(e.target.value);
        });
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').min = today;
    }

    populateTimeSelects() {
        const timeSelect = document.getElementById('time');
        
        this.timeSlots.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }

    createAppointment() {
        const formData = new FormData(document.getElementById('appointmentForm'));
        const selectedTime = document.getElementById('time').value;
        
        // Verificar se um horário foi selecionado
        if (!selectedTime) {
            document.getElementById('timeError').style.display = 'block';
            this.showNotification('Por favor, selecione um horário no painel ao lado.', 'error');
            return;
        }
        
        const appointment = {
            id: Date.now().toString(),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date'),
            time: selectedTime,
            service: formData.get('service'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };

        // Verificar se o horário já está ocupado
        if (this.isTimeSlotBooked(appointment.date, appointment.time)) {
            this.showNotification('Este horário já está ocupado. Escolha outro horário.', 'error');
            return;
        }

        this.appointments.push(appointment);
        this.saveAppointments();
        this.updateTimeSlots();
        this.resetForm();
        this.showNotification('Agendamento criado com sucesso!', 'success');
        
        // Atualizar os horários disponíveis após criar o agendamento
        const selectedDate = document.getElementById('date').value;
        if (selectedDate) {
            this.updateAvailableTimes(selectedDate);
        }
    }

    isTimeSlotBooked(date, time) {
        return this.appointments.some(app => 
            app.date === date && app.time === time
        );
    }



    updateAvailableTimes(selectedDate) {
        const timeSelect = document.getElementById('time');
        const editTimeSelect = document.getElementById('editTime');
        
        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        if (editTimeSelect) {
            editTimeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        }
        
        this.timeSlots.forEach(time => {
            const isBooked = this.isTimeSlotBooked(selectedDate, time);
            
            // Atualizar dropdown do formulário principal (para compatibilidade)
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            if (isBooked) {
                option.textContent += ' (Ocupado)';
                option.disabled = true;
            }
            timeSelect.appendChild(option);
            
            // Atualizar dropdown do formulário de edição (se existir)
            if (editTimeSelect) {
                const editOption = document.createElement('option');
                editOption.value = time;
                editOption.textContent = time;
                if (isBooked) {
                    editOption.textContent += ' (Ocupado)';
                    editOption.disabled = true;
                }
                editTimeSelect.appendChild(editOption);
            }
        });
        
        // Atualizar painel de horários
        this.updateTimeSlots();
    }

    updateTimeSlots() {
        const timeSlotElements = document.querySelectorAll('.time-slot');
        const selectedDate = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        
        timeSlotElements.forEach(slot => {
            const time = slot.dataset.time;
            const isBooked = this.isTimeSlotBooked(selectedDate, time);
            
            // Remover todas as classes exceto a classe base
            slot.className = 'time-slot';
            
            if (isBooked) {
                slot.classList.add('booked');
                // Remover event listeners
                const newSlot = slot.cloneNode(true);
                slot.parentNode.replaceChild(newSlot, slot);
            } else {
                slot.classList.add('available');
                // Adicionar event listener apenas uma vez
                if (!slot.hasAttribute('data-listener')) {
                    slot.setAttribute('data-listener', 'true');
                    slot.addEventListener('click', (e) => {
                        const selectedDate = document.getElementById('date').value;
                        if (!selectedDate) {
                            this.showNotification('Por favor, selecione uma data primeiro.', 'error');
                            return;
                        }

                        const time = e.target.dataset.time;
                        const isBooked = this.isTimeSlotBooked(selectedDate, time);
                        
                        if (!isBooked) {
                            // Remover seleção anterior
                            document.querySelectorAll('.time-slot').forEach(s => {
                                s.classList.remove('selected');
                            });
                            
                            // Adicionar seleção ao slot clicado
                            e.target.classList.add('selected');
                            
                            // Atualizar campo de horário no formulário
                            document.getElementById('time').value = time;
                            
                            // Ocultar mensagem de erro, se estiver visível
                            document.getElementById('timeError').style.display = 'none';
                        }
                    });
                }
            }
        });
    }




    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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

    resetForm() {
        document.getElementById('appointmentForm').reset();
        document.getElementById('time').value = '';
        document.getElementById('timeError').style.display = 'none';
        
        // Remover seleção dos slots de horário
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Atualizar slots de horário
        const selectedDate = document.getElementById('date').value;
        if (selectedDate) {
            this.updateAvailableTimes(selectedDate);
        }
    }

    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Adicionar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        // Definir cores baseadas no tipo
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
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
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }
    
    .no-appointments {
        text-align: center;
        color: #718096;
        font-style: italic;
        padding: 20px;
    }
`;
document.head.appendChild(notificationStyles);

// Inicializar o sistema
const appointmentSystem = new AppointmentSystem();



