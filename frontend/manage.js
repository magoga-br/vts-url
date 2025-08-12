// Carregar URLs quando a página carregar
document.addEventListener('DOMContentLoaded', loadUrls);

async function loadUrls() {
    const urlsList = document.getElementById('urls-list');
    urlsList.innerHTML = '<div class="loading">Carregando URLs...</div>';

    try {
        const response = await fetch('/api/urls');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const urls = await response.json();
        console.log('URLs carregadas:', urls);
        
        if (urls.length === 0) {
            urlsList.innerHTML = '<div class="no-urls">Nenhuma URL encontrada</div>';
            return;
        }

        urlsList.innerHTML = urls.map(url => createUrlItem(url)).join('');
    } catch (error) {
        urlsList.innerHTML = '<div class="no-urls">Erro ao carregar URLs: ' + error.message + '</div>';
        console.error('Erro detalhado:', error);
    }
}

function createUrlItem(url) {
    const name = url.name || 'URL sem nome';
    const shortUrl = `${window.location.origin}/${url.shortUrl}`;
    
    return `
        <div class="url-item" data-id="${url._id}">
            <div class="url-name">
                <span class="name-display">${name}</span>
                <input type="text" class="name-input" value="${name}" style="display: none;">
                <button class="edit-btn" onclick="editName('${url._id}')">✏️ Editar</button>
            </div>
            <div class="url-original">${url.originalUrl}</div>
            <div class="url-short">${shortUrl}</div>
            <div class="url-actions">
                <button class="copy-btn" onclick="copyUrl('${shortUrl}', this)">📋 Copiar</button>
                <button class="save-btn" onclick="saveName('${url._id}')" style="display: none;">💾 Salvar</button>
                <button class="cancel-btn" onclick="cancelEdit('${url._id}')" style="display: none;">❌ Cancelar</button>
                <button class="delete-btn" onclick="deleteUrl('${url._id}')">🗑️ Deletar</button>
            </div>
        </div>
    `;
}

function editName(urlId) {
    const urlItem = document.querySelector(`[data-id="${urlId}"]`);
    const nameDisplay = urlItem.querySelector('.name-display');
    const nameInput = urlItem.querySelector('.name-input');
    const editBtn = urlItem.querySelector('.edit-btn');
    const saveBtn = urlItem.querySelector('.save-btn');
    const cancelBtn = urlItem.querySelector('.cancel-btn');

    nameDisplay.style.display = 'none';
    nameInput.style.display = 'block';
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    nameInput.focus();
}

async function saveName(urlId) {
    const urlItem = document.querySelector(`[data-id="${urlId}"]`);
    const nameDisplay = urlItem.querySelector('.name-display');
    const nameInput = urlItem.querySelector('.name-input');
    const editBtn = urlItem.querySelector('.edit-btn');
    const saveBtn = urlItem.querySelector('.save-btn');
    const cancelBtn = urlItem.querySelector('.cancel-btn');

    const newName = nameInput.value.trim();
    
    if (!newName) {
        alert('O nome não pode estar vazio!');
        return;
    }

    try {
        const response = await fetch(`/api/urls/${urlId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });

        if (response.ok) {
            nameDisplay.textContent = newName;
            nameDisplay.style.display = 'block';
            nameInput.style.display = 'none';
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        } else {
            alert('Erro ao salvar o nome');
        }
    } catch (error) {
        alert('Erro ao salvar o nome');
        console.error('Erro:', error);
    }
}

function cancelEdit(urlId) {
    const urlItem = document.querySelector(`[data-id="${urlId}"]`);
    const nameDisplay = urlItem.querySelector('.name-display');
    const nameInput = urlItem.querySelector('.name-input');
    const editBtn = urlItem.querySelector('.edit-btn');
    const saveBtn = urlItem.querySelector('.save-btn');
    const cancelBtn = urlItem.querySelector('.cancel-btn');

    nameInput.value = nameDisplay.textContent;
    nameDisplay.style.display = 'block';
    nameInput.style.display = 'none';
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

async function deleteUrl(urlId) {
    if (!confirm('Tem certeza que deseja deletar esta URL?')) {
        return;
    }

    try {
        const response = await fetch(`/api/urls/${urlId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const urlItem = document.querySelector(`[data-id="${urlId}"]`);
            urlItem.remove();
            
            // Verificar se não há mais URLs
            const remainingUrls = document.querySelectorAll('.url-item');
            if (remainingUrls.length === 0) {
                document.getElementById('urls-list').innerHTML = '<div class="no-urls">Nenhuma URL encontrada</div>';
            }
        } else {
            alert('Erro ao deletar a URL');
        }
    } catch (error) {
        alert('Erro ao deletar a URL');
        console.error('Erro:', error);
    }
}

async function copyUrl(url, button) {
    const originalText = button.textContent;
    
    try {
        await navigator.clipboard.writeText(url);
        button.textContent = '✅ Copiado!';
        button.style.background = '#28a745';
        
        // Restaurar o texto original após 2 segundos
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#17a2b8';
        }, 2000);
    } catch (error) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        button.textContent = '✅ Copiado!';
        button.style.background = '#28a745';
        
        // Restaurar o texto original após 2 segundos
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#17a2b8';
        }, 2000);
    }
}
