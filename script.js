document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // LÓGICA DO CRONÔMETRO DE CONTAGEM REGRESSIVA
    // =====================================================================
    function initCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        // IMPORTANTE: Defina a data e hora do lançamento aqui!
        const launchDate = new Date('2025-08-13T00:00:00').getTime();

        
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            if (distance < 0) {
                countdownElement.innerHTML = `<div style="font-weight: bold;">Lançamento Realizado!</div>`;
                clearInterval(interval);
                return;
            }

            const days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
            const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            const seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
            
            countdownElement.innerHTML = `
                <div class="countdown-item"><div class="countdown-number">${days}</div><div class="countdown-label">Dias</div></div>
                <div class="countdown-item"><div class="countdown-number">${hours}</div><div class="countdown-label">Horas</div></div>
                <div class="countdown-item"><div class="countdown-number">${minutes}</div><div class="countdown-label">Min</div></div>
                <div class="countdown-item"><div class="countdown-number">${seconds}</div><div class="countdown-label">Seg</div></div>
            `;
        }, 1000);
    }
    initCountdown();

    // =====================================================================
    // LÓGICA DO MODAL DE ONBOARDING (QUESTIONÁRIO)
    // =====================================================================
    
    // URL da sua planilha Google Sheets.
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfGnDKVi4dAZtY8nYdaPWbZnfvq6S794Mr854A_0U9-YJ6oYz3q6Gg3PwFlW1bleIBzw/exec';

    // Seleção de todos os elementos do DOM necessários para o modal.
    const onboardingModal = document.getElementById('onboarding-modal');
    const nextStepBtn = document.getElementById('next-step-btn');
    const steps = document.querySelectorAll('.step-content');
    const progressBarSegments = document.querySelectorAll('.progress-bar-segment');
    const stepCounter = document.getElementById('step-counter');
    const nameInput = document.getElementById('name-input');
    const emailInput = document.getElementById('email-input');
    const openModalBtn = document.querySelector('.btn-launch'); // Botão que abre o modal.

    // Opções para preencher o formulário dinamicamente.
    const sportOptions = ['Corrida', 'Ciclismo', 'Musculação', 'Futebol', 'Tênis', 'Natação', 'Artes Marciais', 'Beach Tennis', 'Surf', 'Escalada', 'Kitesurf', 'Trilha', 'Skate', 'Patins', 'Mergulho', 'Outros']
    const frequencyOptions = ['Diariamente', 'Algumas vezes por semana', 'Uma vez por semana', 'Ocasionalmente'];
    const conditionOptions = ['Novo', 'Semi-novo', 'Usado', 'Qualquer'];

    let currentStep = 0;
    const userPreferences = { name: '', email: '', sports: [], frequency: '', condition: [] };

    // Cria os botões de múltipla escolha para as perguntas do formulário.
    const createOptionButtons = (options, containerId, preferenceKey, isMultiSelect) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.type = 'button'; // Evita submissão de formulário
            button.addEventListener('click', () => {
                if (isMultiSelect) {
                    button.classList.toggle('selected');
                    const index = userPreferences[preferenceKey].indexOf(option);
                    if (index > -1) {
                        userPreferences[preferenceKey].splice(index, 1);
                    } else {
                        userPreferences[preferenceKey].push(option);
                    }
                } else {
                    userPreferences[preferenceKey] = option;
                    container.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                    button.classList.add('selected');
                }
            });
            container.appendChild(button);
        });
    };

    // Controla a exibição do passo atual do formulário.
    const showStep = (stepIndex) => {
        steps.forEach((step, index) => step.classList.toggle('active', index === stepIndex));
        progressBarSegments.forEach((segment, index) => segment.classList.toggle('active', index <= stepIndex));
        stepCounter.textContent = `Passo ${stepIndex + 1} de ${steps.length}`;
        nextStepBtn.textContent = (stepIndex === steps.length - 1) ? 'Finalizar' : 'Continuar';
    };

    const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Valida as informações de cada passo antes de permitir avançar.
    const validateStep = () => {
        userPreferences.name = nameInput.value.trim();
        userPreferences.email = emailInput.value.trim();

        switch(currentStep) {
            case 0: if (userPreferences.name.length < 3) { alert("Por favor, insira um nome válido."); return false; } break;
            case 1: if (!validateEmailFormat(userPreferences.email)) { alert("Por favor, insira um e-mail válido."); return false; } break;
            case 2: if (userPreferences.sports.length === 0) { alert("Selecione pelo menos um esporte."); return false; } break;
            case 3: if (!userPreferences.frequency) { alert("Selecione uma frequência."); return false; } break;
            case 4: if (userPreferences.condition.length === 0) { alert("Selecione pelo menos uma condição."); return false; } break;
        }
        return true;
    };
    
    // Envia os dados coletados para a planilha do Google Sheets.
    const submitToGoogleSheet = () => {
        nextStepBtn.disabled = true;
        nextStepBtn.textContent = 'Enviando...';

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPreferences),
        })
        .then(() => {
            alert("Obrigado! Suas preferências foram salvas. Você está na nossa lista VIP!");
            closeOnboarding();
        })
        .catch(error => {
            console.error('Erro ao enviar dados:', error);
            alert("Ocorreu um erro. Por favor, tente novamente.");
        })
        .finally(() => {
            nextStepBtn.disabled = false;
        });
    }

    // Gerencia a navegação entre os passos do formulário.
    if(nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (!validateStep()) return;
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            } else {
                submitToGoogleSheet();
            }
        });
    }

    // Funções para abrir e fechar o modal.
    const openOnboarding = () => {
        if (!onboardingModal) return;
        onboardingModal.classList.add('active');
        if (!document.getElementById('sports-options').hasChildNodes()) {
            createOptionButtons(sportOptions, 'sports-options', 'sports', true);
            createOptionButtons(frequencyOptions, 'frequency-options', 'frequency', false);
            createOptionButtons(conditionOptions, 'condition-options', 'condition', true);
        }
        showStep(currentStep);
    };

    const closeOnboarding = () => {
        if (!onboardingModal) return;
        onboardingModal.classList.remove('active');
    };
    
    // Adiciona o evento de clique ao botão principal para abrir o modal.
    if (openModalBtn) {
        openModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOnboarding();
        });
    }
    
    // Permite fechar o modal clicando fora do card.
    if(onboardingModal){
        onboardingModal.addEventListener('click', (event) => {
            if (event.target === onboardingModal) closeOnboarding();
        });
    }
});