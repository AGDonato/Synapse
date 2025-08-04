// Configuração da relação de combinação do Tipo de Documento e Assunto
const documentoAssuntoConfig = {
    "Autos Circunstanciados": ["Ações Virtuais Controladas", "Outros"],
    "Mídia": [],
    "Ofício": ["Comunicação de não cumprimento de decisão judicial", "Encaminhamento de autos circunstanciados", "Encaminhamento de decisão judicial", "Encaminhamento de mídia", "Encaminhamento de relatório de inteligência", "Encaminhamento de relatório técnico", "Encaminhamento de relatório técnico e mídia", "Requisição de dados cadastrais", "Requisição de dados cadastrais e preservação de dados", "Solicitação de dados cadastrais", "Outros"],
    "Ofício Circular": ["Encaminhamento de decisão judicial", "Requisição de dados cadastrais", "Requisição de dados cadastrais e preservação de dados", "Solicitação de dados cadastrais", "Outros"],
    "Relatório de Inteligência": ["Análise de evidências", "Análise de vulnerabilidade", "Compilação de evidências", "Compilação e análise de evidências", "Investigação Cibernética", "Levantamentos de dados cadastrais", "Preservação de dados", "Outros"],
    "Relatório Técnico": ["Análise de evidências", "Análise de vulnerabilidade", "Compilação de evidências", "Compilação e análise de evidências", "Investigação Cibernética", "Levantamentos de dados cadastrais", "Preservação de dados", "Outros"]
};

// Configurações de visibilidade das seções baseada na combinação do Tipo de Documento e Assunto
const secaoConfiguracoes = {
    "Autos Circunstanciados|Ações Virtuais Controladas": { section2: false, section3: false, section4: false },
    "Autos Circunstanciados|Outros": { section2: false, section3: false, section4: false },
    "Ofício|Comunicação de não cumprimento de decisão judicial": { section2: false, section3: false, section4: false },
    "Ofício|Encaminhamento de autos circunstanciados": { section2: false, section3: false, section4: false },
    "Ofício|Encaminhamento de decisão judicial": { section2: true, section3: false, section4: true },
    "Ofício|Encaminhamento de mídia": { section2: false, section3: false, section4: false },
    "Ofício|Encaminhamento de relatório de inteligência": { section2: false, section3: false, section4: false },
    "Ofício|Encaminhamento de relatório técnico": { section2: false, section3: false, section4: false },
    "Ofício|Encaminhamento de relatório técnico e mídia": { section2: false, section3: false, section4: false },
    "Ofício|Requisição de dados cadastrais": { section2: false, section3: false, section4: true },
    "Ofício|Requisição de dados cadastrais e preservação de dados": { section2: false, section3: false, section4: true },
    "Ofício|Solicitação de dados cadastrais": { section2: false, section3: false, section4: true },
    "Ofício|Outros": { section2: true, section3: true, section4: true },
    "Ofício Circular|Encaminhamento de decisão judicial": { section2: true, section3: false, section4: true },
    "Ofício Circular|Requisição de dados cadastrais": { section2: false, section3: false, section4: true },
    "Ofício Circular|Requisição de dados cadastrais e preservação de dados": { section2: false, section3: false, section4: true },
    "Ofício Circular|Solicitação de dados cadastrais": { section2: false, section3: false, section4: true },
    "Ofício Circular|Outros": { section2: true, section3: true, section4: true },
    "Relatório de Inteligência|Análise de evidências": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Análise de vulnerabilidade": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Compilação de evidências": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Compilação e análise de evidências": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Investigação Cibernética": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Levantamentos de dados cadastrais": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Preservação de dados": { section2: false, section3: false, section4: false },
    "Relatório de Inteligência|Outros": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Análise de evidências": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Análise de vulnerabilidade": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Compilação de evidências": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Compilação e análise de evidências": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Investigação Cibernética": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Levantamentos de dados cadastrais": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Preservação de dados": { section2: false, section3: false, section4: false },
    "Relatório Técnico|Outros": { section2: false, section3: false, section4: false },
    "Mídia|SEM_ASSUNTO": { section2: false, section3: true, section4: false },
};

// Listas para campos com filtro
const destinatarios = ["Ministério Público Federal", "Ministério Público Estadual", "Polícia Federal", "Polícia Civil", "Receita Federal", "Banco Central", "COAF - Conselho de Controle de Atividades Financeiras", "CVM - Comissão de Valores Mobiliários", "ANATEL - Agência Nacional de Telecomunicações", "Tribunal de Contas da União", "Controladoria-Geral da União"];
const enderecamentos = ["Polícia Federal - Superintendência Regional em Goiás", "Polícia Civil do Estado de Goiás", "Tribunal de Justiça de Goiás", "Ministério Público do Estado de Goiás", "Procuradoria da República em Goiás", "Receita Federal do Brasil - 10ª Região Fiscal", "Banco Central do Brasil - Representação Regional em Goiás", "TJGO - Vara Criminal", "JFGO - Vara Federal Criminal", "Delegacia de Crimes Cibernéticos"];
const autoridades = ["Dr. João Silva - Juiz Federal", "Dra. Maria Santos - Juíza Federal", "Dr. Pedro Oliveira - Juiz Estadual", "Dra. Ana Costa - Juíza Estadual", "Des. Carlos Ferreira - Desembargador Federal", "Des. Luciana Almeida - Desembargadora Federal", "Min. Roberto Lima - Ministro STJ", "Min. Patricia Souza - Ministra STF"];
const orgaosJudiciais = ["Tribunal de Justiça de Goiás - TJGO", "Tribunal Regional Federal da 1ª Região - TRF1", "Supremo Tribunal Federal - STF", "Superior Tribunal de Justiça - STJ", "Justiça Federal de Goiás - JFGO", "Vara Criminal de Goiânia", "Vara de Execução Penal", "Vara Especializada em Crime Organizado", "Juizado Especial Criminal"];
const analistas = ["Ana Paula Silva", "Carlos Eduardo Santos", "Fernanda Oliveira", "João Pedro Costa", "Maria Fernanda Lima", "Paulo Roberto Almeida", "Rafael Souza", "Tatiana Ferreira"];

const SELECTORS = {
    documentForm: '#documentForm',
    secaoPesquisa: '#section4',
    pesquisaList: '#pesquisaList',
    pesquisaItem: '.pesquisa-item',
    tipoDocumento: '#tipoDocumento',
    assunto: '#assunto',
    assuntoGroup: '#assuntoGroup',
    assuntoWrapper: '.assunto-wrapper',
    assuntoOutros: '#assuntoOutros',
    anoDocumento: '#anoDocumento',
    analista: '#analista',
    destinatarioInput: '#destinatario',
    enderecamentoInput: '#enderecamento',
    autoridadeInput: '#autoridade',
    orgaoJudicialInput: '#orgaoJudicial',
    searchContainer: '.search-container',
    searchResults: '.search-results',
    statusIndicator: '#statusIndicator',
    btnSubmit: '#btnSubmit',
    btnGenerate: '#btnGenerate',
    retificadaCheckbox: '#retificada',
    retificadaContainer: '#retificadaContainer',
    retificadaSection: '.retificada-section',
    checkboxChainRetificada: '.checkbox-chain-retificada',
    checkboxLabel: '.checkbox-label',
    inputAutoridadeRet: 'input[name="autoridadeRet[]"]',
    inputOrgaoJudicialRet: 'input[name="orgaoJudicialRet[]"]',
    btnAddPesquisa: '.btn-add',
    btnRemovePesquisa: '.btn-remove',
    btnExpandPesquisa: '.btn-expand',
    inputIdentificador: 'input[name="identificador[]"]',
    selectTipoPesquisa: 'select[name="tipoPesquisa[]"]',
    templatePesquisa: '#template-pesquisa',
    templateRetificada: '#template-retificada',
    formGroup: '.form-group',
    requiredSpan: '.required',
    hidden: '.hidden',
    pesquisaControls: '.pesquisa-controls'
};

// Variável global que armazena o estado de "salvo" do documento.
let documentSaved = false;

/**
 * Ponto de entrada do script. É executado quando o HTML da página termina de carregar.
 */
document.addEventListener('DOMContentLoaded', function() {
    populateTipoDocumento();
    populateAnos();
    populateAnalistas();
    setupSearchFilters();
    setupFormListeners();
    document.querySelector(SELECTORS.tipoDocumento).focus();
});

/**
 * Preenche o menu dropdown de "Tipo de Documento" com base nas chaves do objeto de configuração.
 */
function populateTipoDocumento() {
    const select = document.querySelector(SELECTORS.tipoDocumento);
    Object.keys(documentoAssuntoConfig).forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        select.appendChild(option);
    });
}

/**
 * Preenche o menu dropdown de "Ano" com os últimos 10 anos a partir do ano atual.
 */
function populateAnos() {
    const select = document.querySelector(SELECTORS.anoDocumento);
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        select.appendChild(option);
    }
}

/**
 * Preenche o menu dropdown de "Analista" com a lista de nomes predefinida.
 */
function populateAnalistas() {
    const select = document.querySelector(SELECTORS.analista);
    analistas.forEach(analista => {
        const option = document.createElement('option');
        option.value = analista;
        option.textContent = analista;
        select.appendChild(option);
    });
}

/**
 * Inicializa todos os campos de formulário que possuem a funcionalidade de busca com autocompletar.
 */
function setupSearchFilters() {
    setupSearchField(SELECTORS.destinatarioInput, destinatarios);
    setupSearchField(SELECTORS.enderecamentoInput, enderecamentos);
    setupSearchField(SELECTORS.autoridadeInput, autoridades);
    setupSearchField(SELECTORS.orgaoJudicialInput, orgaosJudiciais);
}

/**
 * Configura um campo de input individual para ter a funcionalidade de busca com autocompletar.
 * @param {string|HTMLElement} fieldSelector - O seletor de ID do campo ou o próprio elemento do campo.
 * @param {string[]} dataList - A lista de strings que servirá como fonte de dados para a busca.
 */
function setupSearchField(fieldSelector, dataList) {
    const input = (typeof fieldSelector === 'string') ? document.querySelector(fieldSelector) : fieldSelector;
    const results = input.closest(SELECTORS.searchContainer).querySelector(SELECTORS.searchResults);
    if (!input || !results) return;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const filtered = dataList.filter(item => item.toLowerCase().includes(query));
        results.innerHTML = '';

        if (query && filtered.length > 0) {
            filtered.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.textContent = item;
                resultItem.addEventListener('click', () => {
                    input.value = item;
                    results.style.display = 'none';
                });
                results.appendChild(resultItem);
            });
            results.style.display = 'block';
        } else {
            results.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

/**
 * Configura todos os "ouvintes" de eventos do formulário.
 * Esta função centraliza toda a lógica de interação do usuário.
 */
function setupFormListeners() {
    // Listener para Mudança no Tipo de Documento
    document.querySelector(SELECTORS.tipoDocumento).addEventListener('change', function() {
        const tipo = this.value;
        const assuntoSelect = document.querySelector(SELECTORS.assunto);
        const assuntoGroup = document.querySelector(SELECTORS.assuntoGroup);
        resetarCampoAssuntoOutros();

        if (tipo === 'Mídia') {
            assuntoGroup.classList.add('hidden');
            assuntoSelect.disabled = true;
            assuntoSelect.required = false;
            assuntoSelect.value = '';
            updateSectionVisibility();
        } else {
            assuntoGroup.classList.remove('hidden');
            assuntoSelect.required = true;
            assuntoSelect.innerHTML = '<option value="">Selecione...</option>';
            assuntoSelect.disabled = !tipo;
            if (tipo && documentoAssuntoConfig[tipo]) {
                documentoAssuntoConfig[tipo].forEach(assunto => {
                    const option = document.createElement('option');
                    option.value = assunto;
                    option.textContent = assunto;
                    assuntoSelect.appendChild(option);
                });
            }
            updateSectionVisibility();
        }
    });

    // Listener para Mudança no Assunto
    document.querySelector(SELECTORS.assunto).addEventListener('change', function(event) {
        const selectAssunto = event.target;
        const wrapper = selectAssunto.parentElement;
        if (!wrapper || !wrapper.classList.contains('assunto-wrapper')) {
            console.error('Erro: O elemento .assunto-wrapper não foi encontrado como pai do select.');
            return;
        }
        const inputOutros = wrapper.querySelector(SELECTORS.assuntoOutros);
        const isOutros = selectAssunto.value === 'Outros';
        wrapper.classList.toggle('is-outros-selected', isOutros);
        inputOutros.classList.toggle('hidden', !isOutros);

        if (isOutros) {
            inputOutros.required = true;
            inputOutros.focus();
        } else {
            resetarCampoAssuntoOutros();
        }
        updateSectionVisibility();
    });

    // Listener para Checkbox de Retificada
    document.querySelector(SELECTORS.retificadaCheckbox).addEventListener('change', handleMasterRetificadaChange);
    
    // Listener para Submissão do Formulário
    document.querySelector(SELECTORS.documentForm).addEventListener('submit', handleFormSubmit);

    // Listener para Mudanças Gerais no Formulário (para o status "salvo")
    document.querySelector(SELECTORS.documentForm).addEventListener('input', function() {
        if (documentSaved) {
            updateDocumentStatus(false);
        }
    });

    // Listener de Delegação para a ação de "Colar" (Paste) na Lista de Pesquisa
    const listaPesquisa = document.querySelector(SELECTORS.pesquisaList);
    listaPesquisa.addEventListener('paste', function(event) {
        if (event.target.matches(SELECTORS.inputIdentificador)) {
            handlePasteMultipleValues(event, event.target);
        }
    });

    // Listener de Delegação para Cliques nos botões da Seção de Pesquisa
    const secaoPesquisa = document.querySelector(SELECTORS.secaoPesquisa);
    secaoPesquisa.addEventListener('click', function(event) {
        if (event.target.matches(SELECTORS.btnAddPesquisa)) {
            addPesquisa();
        }
        if (event.target.matches(SELECTORS.btnRemovePesquisa)) {
            removeLastPesquisa();
        }
        if (event.target.matches(SELECTORS.btnExpandPesquisa)) {
            togglePesquisaColumn(event.target);
        }
    });
}

/**
 * Função auxiliar para esconder e resetar o campo de texto 'Outros' do Assunto.
 */
function resetarCampoAssuntoOutros() {
    const wrapper = document.querySelector(SELECTORS.assuntoWrapper);
    const inputOutros = document.querySelector(SELECTORS.assuntoOutros);
    if (wrapper && inputOutros) {
        wrapper.classList.remove('is-outros-selected');
        inputOutros.classList.add('hidden');
        inputOutros.required = false;
        inputOutros.value = '';
    }
}

/**
 * Encontra todos os campos de formulário dentro de uma seção e os limpa.
 * @param {HTMLElement} sectionElement - O elemento da seção (ex: document.getElementById('section2')).
 */
function limparCamposDaSecao(sectionElement) {
    const fields = sectionElement.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        switch (field.type) {
            case 'checkbox':
            case 'radio':
                field.checked = false;
                break;
            case 'select-one':
            case 'select-multiple':
                field.selectedIndex = 0;
                break;
            default:
                field.value = '';
                break;
        }
    });
}

/**
 * Atualiza a UI (indicador de status e botões) com base no estado de "salvo" do documento.
 * @param {boolean} isSaved - `true` se o documento está salvo, `false` caso contrário.
 */
function updateDocumentStatus(isSaved) {
    const indicator = document.querySelector(SELECTORS.statusIndicator);
    const btnSubmit = document.querySelector(SELECTORS.btnSubmit);
    const btnGenerate = document.querySelector(SELECTORS.btnGenerate);
    documentSaved = isSaved;

    if (isSaved) {
        indicator.textContent = '● Salvo';
        indicator.className = 'status-indicator status-saved';
        btnSubmit.disabled = true;
        btnGenerate.disabled = false;
    } else {
        indicator.textContent = '● Não Salvo';
        indicator.className = 'status-indicator status-unsaved';
        btnSubmit.disabled = false;
        btnGenerate.disabled = true;
    }
}

/**
 * Mostra ou esconde as seções do formulário (2, 3 e 4) com base nas seleções de Tipo e Assunto.
 * Também limpa os campos das seções que são escondidas.
 */
function updateSectionVisibility() {
    const tipo = document.querySelector(SELECTORS.tipoDocumento).value;
    const assunto = document.querySelector(SELECTORS.assunto).value;
    let configKey;
    if (tipo === 'Mídia') {
        configKey = 'Mídia|SEM_ASSUNTO';
    } else if (tipo && assunto) {
        configKey = `${tipo}|${assunto}`;
    }

    const config = secaoConfiguracoes[configKey] || {};
    const sectionsToManage = ['section2', 'section3', 'section4'];
    sectionsToManage.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const shouldBeVisible = config[sectionId] === true;
        if (shouldBeVisible) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
            limparCamposDaSecao(section);
        }
    });
    updateRequiredFields();
}

/**
 * Ativa ou desativa o atributo 'required' dos campos com base na visibilidade de sua seção pai.
 * Garante que apenas campos visíveis sejam obrigatórios para a validação do formulário.
 */
function updateRequiredFields() {
    const sections = ['section2', 'section3', 'section4'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const isVisible = !section.classList.contains('hidden');
        section.querySelectorAll('input, select').forEach(field => {
            if (field.closest(SELECTORS.retificadaSection)) return;
            const hasRequired = field.closest(SELECTORS.formGroup)?.querySelector(SELECTORS.requiredSpan);
            if (hasRequired) {
                field.required = isVisible;
            }
        });
    });
}

/**
 * Lida com a mudança no checkbox mestre de "Retificada".
 * Cria a primeira seção de retificação ou remove todas elas.
 * @param {Event} event - O objeto de evento 'change' do checkbox.
 */
function handleMasterRetificadaChange(event) {
    const container = document.querySelector(SELECTORS.retificadaContainer);
    if (event.target.checked) {
        createRetificadaSection();
    } else {
        container.innerHTML = '';
    }
}

/**
 * Lida com a mudança nos checkboxes de "Retificada" que existem dentro de cada seção.
 * Cria ou remove a seção seguinte na cadeia.
 * @param {Event} event - O objeto de evento 'change' do checkbox.
 */
function handleChainedRetificadaChange(event) {
    const checkbox = event.target;
    const controlledSectionId = checkbox.dataset.controlsId;
    if (checkbox.checked) {
        if (!controlledSectionId) {
            createRetificadaSection(checkbox);
        }
    } else {
        if (controlledSectionId) {
            const sectionToRemove = document.getElementById(controlledSectionId);
            if (sectionToRemove) {
                sectionToRemove.remove();
            }
            delete checkbox.dataset.controlsId;
        }
    }
}

/**
 * Cria e insere uma nova seção de retificação no DOM.
 * @param {HTMLInputElement} [controllingCheckbox=null] - O checkbox da seção anterior que controla esta nova seção.
 */
function createRetificadaSection(controllingCheckbox = null) {
    const template = document.querySelector(SELECTORS.templateRetificada);
    const clone = template.content.cloneNode(true);
    const newSection = clone.querySelector(SELECTORS.retificadaSection);
    const container = document.querySelector(SELECTORS.retificadaContainer);

    const nextId = (Date.now() + Math.random()).toString(36);
    newSection.id = `retificada-${nextId}`;
    const numSections = container.querySelectorAll(SELECTORS.retificadaSection).length + 1;
    newSection.querySelector('.retificada-header span').textContent = `Decisão Retificadora ${numSections}`;

    const chainedCheckbox = newSection.querySelector(SELECTORS.checkboxChainRetificada);
    const label = newSection.querySelector(SELECTORS.checkboxLabel);
    chainedCheckbox.id = `checkbox-chain-${nextId}`;
    label.htmlFor = chainedCheckbox.id;
    chainedCheckbox.addEventListener('change', handleChainedRetificadaChange);

    if (controllingCheckbox) {
        controllingCheckbox.dataset.controlsId = newSection.id;
    }

    container.appendChild(newSection);

    const autoridadeInput = newSection.querySelector(SELECTORS.inputAutoridadeRet);
    const orgaoInput = newSection.querySelector(SELECTORS.inputOrgaoJudicialRet);
    setupSearchField(autoridadeInput, autoridades);
    setupSearchField(orgaoInput, orgaosJudiciais);
}

/**
 * Adiciona uma nova linha de pesquisa à seção 4, usando o <template> do HTML.
 * @param {boolean} [scrollToNew=true] - Se a página deve rolar para a nova linha.
 * @returns {HTMLElement} O novo elemento de pesquisa que foi adicionado.
 */
function addPesquisa(scrollToNew = true) {
    const template = document.querySelector(SELECTORS.templatePesquisa);
    const clone = template.content.cloneNode(true);
    const newPesquisa = clone.querySelector(SELECTORS.pesquisaItem);
    const list = document.querySelector(SELECTORS.pesquisaList);
    const nextIndex = list.querySelectorAll(SELECTORS.pesquisaItem).length;

    const select = newPesquisa.querySelector(SELECTORS.selectTipoPesquisa);
    const input = newPesquisa.querySelector(SELECTORS.inputIdentificador);
    const labelSelect = select.closest(SELECTORS.formGroup).querySelector('label');
    const labelInput = input.closest(SELECTORS.formGroup).querySelector('label');

    newPesquisa.setAttribute('data-index', nextIndex);
    select.id = `tipoPesquisa${nextIndex}`;
    labelSelect.setAttribute('for', select.id);
    input.id = `identificador${nextIndex}`;
    labelInput.setAttribute('for', input.id);
    input.addEventListener('paste', (event) => handlePasteMultipleValues(event, input));

    list.appendChild(newPesquisa);
    if (scrollToNew) {
        newPesquisa.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return newPesquisa;
}

/**
 * Remove a última linha de pesquisa do formulário, se houver mais de uma.
 */
function removeLastPesquisa() {
    const list = document.querySelector(SELECTORS.pesquisaList);
    const items = list.querySelectorAll(SELECTORS.pesquisaItem);
    if (items.length > 1) {
        items[items.length - 1].remove();
    } else {
        showNotification('Deve haver pelo menos uma linha de pesquisa.', 'error');
    }
}

/**
 * Adiciona ou remove a coluna "Complementar" em uma linha de pesquisa.
 * @param {HTMLButtonElement} button - O botão ⊕/⊖ que foi clicado.
 */
/**
 * Adiciona ou remove a coluna "Complementar" em uma linha de pesquisa.
 * @param {HTMLButtonElement} button - O botão ⊕/⊖ que foi clicado.
 */
function togglePesquisaColumn(button) {
    const pesquisaItem = button.closest(SELECTORS.pesquisaItem);
    const isExpanded = pesquisaItem.classList.contains('expanded');
    
    if (isExpanded) {
        // A seleção por nome é mais robusta que :nth-child(3)
        const complementarGroup = pesquisaItem.querySelector('input[name="complementar[]"]').closest(SELECTORS.formGroup);
        if (complementarGroup) complementarGroup.remove();
        
        pesquisaItem.classList.remove('expanded');
        button.innerHTML = '⊕';
        button.title = 'Adicionar coluna';
    } else {
        pesquisaItem.classList.add('expanded');
        const newColumn = document.createElement('div');
        newColumn.className = 'form-group';
        newColumn.innerHTML = `
            <label class="form-label">Complementar <span class="required">*</span></label>
            <input type="text" name="complementar[]" class="form-input" required>
        `;
        const controls = pesquisaItem.querySelector(SELECTORS.pesquisaControls);
        pesquisaItem.insertBefore(newColumn, controls);
        button.innerHTML = '⊖';
        button.title = 'Remover coluna';
    }
}

/**
 * Lida com a colagem de múltiplos valores em um campo de "Identificador".
 * Distribui os valores colados pelas linhas de pesquisa seguintes, criando novas se necessário.
 * @param {ClipboardEvent} event - O objeto do evento 'paste'.
 * @param {HTMLInputElement} startInput - O campo de input onde a colagem ocorreu.
 */
function handlePasteMultipleValues(event, startInput) {
    event.preventDefault();
    const pastedData = (event.clipboardData || window.clipboardData)?.getData('text');
    if (!pastedData) return;

    const values = pastedData.split(/[\n,;]+/).map(v => v.trim()).filter(Boolean);
    if (values.length === 0) return;

    let currentRow = startInput.closest(SELECTORS.pesquisaItem);
    if (!currentRow) {
        console.error(`Container '${SELECTORS.pesquisaItem}' não encontrado.`);
        return;
    }
    const tipoPesquisa = currentRow.querySelector(SELECTORS.selectTipoPesquisa).value;
    let lastModifiedElement = null;

    values.forEach((value, index) => {
        let targetInput;
        let targetSelect;
        if (index > 0) {
            const nextRow = currentRow.nextElementSibling;
            if (nextRow && nextRow.matches(SELECTORS.pesquisaItem)) {
                currentRow = nextRow;
            } else {
                const newRowElement = addPesquisa(false);
                if (newRowElement) {
                    currentRow = newRowElement;
                } else {
                    return;
                }
            }
        }
        if (currentRow) {
            targetInput = currentRow.querySelector(SELECTORS.inputIdentificador);
            targetSelect = currentRow.querySelector(SELECTORS.selectTipoPesquisa);
            if (targetInput && targetSelect) {
                const finalTargetInput = (index === 0) ? startInput : targetInput;
                finalTargetInput.value = value;
                targetSelect.value = tipoPesquisa;
                lastModifiedElement = currentRow;
            }
        }
    });

    if (lastModifiedElement) {
        lastModifiedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (typeof showNotification === 'function') {
        showNotification(`${values.length} itens foram distribuídos com sucesso!`, 'success');
    }
}

/**
 * Lida com o evento de submissão do formulário principal.
 * Previne o recarregamento da página, exibe uma notificação de sucesso e atualiza o status do documento para 'Salvo'.
 * @param {SubmitEvent} event - O objeto de evento de submissão, enviado pelo navegador.
 */
function handleFormSubmit(event) {
    event.preventDefault();
    showNotification('Documento criado com sucesso!', 'success');
    updateDocumentStatus(true);
}

/**
 * Lida com o clique no botão "Gerar Documento".
 */
document.querySelector(SELECTORS.btnGenerate).addEventListener('click', function() {
    // 1. Verifica se o documento está salvo (lógica mantida)
    if (!documentSaved) {
        showNotification('Salve o documento antes de gerar.', 'error');
        return;
    }

    // 2. Apenas mostra a notificação de sucesso.
    // O botão não muda de aparência nem é desabilitado.
    showNotification('Documento gerado com sucesso!', 'success');
});

/**
 * Exibe uma notificação temporária no canto superior direito da tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='info'] - O tipo da notificação ('success', 'error', 'info'), que define sua cor.
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.textContent = message;
    const colors = {
        success: '#059669', error: '#dc2626', info: '#2563eb'
    };
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);

    // Tempo para a notificação permanecer antes de começar a desaparecer
    const displayDuration = 3000; 

    // Obtém a duração da animação da variável CSS
    // Isso garante que o JS e o CSS estejam sincronizados
    const style = getComputedStyle(document.documentElement);
    const fadeOutDuration = parseFloat(style.getPropertyValue('--transition-normal')) * 1000; // Converte para milissegundos

    setTimeout(() => {
        notification.classList.add('slide-out');
        
        // Adiciona um listener para remover a notificação quando a animação terminar
        notification.addEventListener('animationend', () => {
            notification.remove();
        }, { once: true });

        // Adiciona um fallback setTimeout para remover a notificação, caso animationend não dispare
        setTimeout(() => {
            if (notification.parentNode) { // Verifica se ainda está no DOM
                notification.remove();
            }
        }, fadeOutDuration + 50); // Um pouco mais do que a duração da animação para garantir
    }, displayDuration);
}

function addTooltips() {
    const tooltips = {
        'tipoDocumento': 'Selecione o tipo de documento que será criado',
        'assunto': 'O assunto define quais seções serão exibidas',
        'retificada': 'Marque se esta decisão foi retificada por outra posterior'
    };
    
    Object.entries(tooltips).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) {
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-icon';
            tooltip.innerHTML = '?';
            tooltip.title = text;
            element.parentElement.appendChild(tooltip);
        }
    });
}