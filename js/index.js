const output = document.getElementById('output');
const input = document.getElementById('command-input');
const prompt = document.getElementById('prompt');
const suggestions = document.getElementById('autocomplete-suggestions');
const editor = document.getElementById('editor');
const editorContent = document.getElementById('editor-content');
const editorFile = document.getElementById('editor-file');
const lineNumbers = document.getElementById('line-numbers');
const editorStatus = document.getElementById('editor-status');
let history = JSON.parse(localStorage.getItem('commandHistory')) || [];
let historyIndex = history.length;
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentPath = '/';
let fileSystem = JSON.parse(localStorage.getItem('fileSystem')) || { '/': {} };
let currentFile = null;

const commands = {
    'help': () => `
        <div class="table">
            <div class="header">Command</div><div class="header">Description</div>
            <div>help</div><div>Show this help menu</div>
            <div>ip</div><div>Display user IP</div>
            <div>info</div><div>Show browser info</div>
            <div>by</div><div>Show credits</div>
            <div>clear</div><div>Clear terminal output</div>
            <div>time</div><div>Show current time</div>
            <div>theme [dark|light|hacker|retro]</div><div>Change terminal theme</div>
            <div>quote</div><div>Show a random quote</div>
            <div>whoami</div><div>Show user profile</div>
            <div>joke</div><div>Show a programming joke</div>
            <div>ascii [text]</div><div>Generate ASCII art</div>
            <div>ping [url]</div><div>Ping a website</div>
            <div>history</div><div>Show command history</div>
            <div>weather [city]</div><div>Show weather for a city</div>
            <div>mkdir [name]</div><div>Create a directory</div>
            <div>touch [name]</div><div>Create a file</div>
            <div>ls</div><div>List directory contents</div>
            <div>cd [path]</div><div>Change directory</div>
            <div>cat [file]</div><div>View file contents</div>
            <div>rm [name]</div><div>Remove file or directory</div>
            <div>nano [file]</div><div>Edit file in nano</div>
            <div>pwd</div><div>Print working directory</div>
            <div>mv [src] [dest]</div><div>Move or rename file/directory</div>
            <div>cp [src] [dest]</div><div>Copy file/directory</div>
            <div>echo [text]</div><div>Print text to terminal</div>
        </div>
    `,
    'ip': async () => {
        try {
            const cache = localStorage.getItem('ipCache');
            if (cache) return `Your IP Address: ${cache}`;
            const response = await axios.get('https://api.ipify.org?format=json');
            localStorage.setItem('ipCache', response.data.ip);
            return `Your IP Address: ${response.data.ip}`;
        } catch {
            return `<span class="error">Failed to fetch IP address. Try again later.</span>`;
        }
    },
    'info': () => `
        <div class="table">
            <div class="header">Property</div><div class="header">Value</div>
            <div>Browser</div><div>${navigator.userAgent.split(' ').pop()}</div>
            <div>OS</div><div>${navigator.platform}</div>
            <div>Screen</div><div>${window.screen.width}x${window.screen.height}</div>
            <div>Language</div><div>${navigator.language}</div>
            <div>Timezone</div><div>${Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </div>
    `,
    'by': () => `
        <div class="by-card">
            <div class="header">Terminal-Web Credits</div>
            <div class="item">
                <span class="label">GitHub</span>
                <span class="value"><a href="https://github.com/sentinelzxofc/terminal-web">github.com/sentinelzxofc/terminal-web</a></span>
            </div>
            <div class="item">
                <span class="label">Instagram</span>
                <span class="value"><a href="https://www.instagram.com/sentinelzxofc">@sentinelzxofc</a></span>
            </div>
            <div class="item">
                <span class="label">By</span>
                <span class="value">sentinelzxofc</span>
            </div>
        </div>
    `,
    'clear': () => {
        output.innerHTML = '';
        return '';
    },
    'time': () => `Current Time: ${new Date().toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`,
    'theme': (args) => {
        if (!args || !['dark', 'light', 'hacker', 'retro'].includes(args)) {
            return `<span class="error">Usage: theme [dark|light|hacker|retro]</span>`;
        }
        document.body.className = `theme-${args}`;
        currentTheme = args;
        localStorage.setItem('theme', args);
        return `Theme changed to ${args}`;
    },
    'quote': async () => {
        try {
            const cache = localStorage.getItem('quoteCache');
            if (cache && Date.now() - localStorage.getItem('quoteTime') < 3600000) {
                return cache;
            }
            const response = await axios.get('https://api.quotable.io/random');
            const quote = `Quote: "${response.data.content}" — ${response.data.author}`;
            localStorage.setItem('quoteCache', quote);
            localStorage.setItem('quoteTime', Date.now());
            return quote;
        } catch {
            return `<span class="error">Failed to fetch quote. Try again later.</span>`;
        }
    },
    'whoami': () => `
        <div class="table">
            <div class="header">Field</div><div class="header">Value</div>
            <div>User</div><div>Anonymous Hacker</div>
            <div>Role</div><div>Explorer of Terminal-Web</div>
            <div>Mission</div><div>Master the command line!</div>
        </div>
    `,
    'joke': async () => {
        try {
            const response = await axios.get('https://v2.jokeapi.dev/joke/Programming?type=single');
            return `Joke: ${response.data.joke}`;
        } catch {
            return `<span class="error">Failed to fetch joke. Try again later.</span>`;
        }
    },
    'ascii': (args) => {
        if (!args) return `<span class="error">Usage: ascii [text]</span>`;
        return new Promise((resolve) => {
            figlet.text(args, { font: 'Standard' }, (err, data) => {
                resolve(err ? `<span class="error">Error generating ASCII art</span>` : `<pre>${data}</pre>`);
            });
        });
    },
    'ping': async (args) => {
        if (!args) return `<span class="error">Usage: ping [url]</span>`;
        const url = args.startsWith('http') ? args : `https://${args}`;
        try {
            const start = Date.now();
            await axios.head(url);
            const time = Date.now() - start;
            return `Ping ${args}: 200 OK (${time}ms)`;
        } catch {
            return `<span class="error">Ping failed: ${args} unreachable</span>`;
        }
    },
    'history': () => {
        if (!history.length) return 'No command history';
        return `<div>${history.map((cmd, i) => `${i + 1}. ${cmd}`).join('<br>')}</div>`;
    },
    'weather': async (args) => {
        if (!args) return `<span class="error">Usage: weather [city]</span>`;
        try {
            const cacheKey = `weather_${args.toLowerCase()}`;
            const cache = localStorage.getItem(cacheKey);
            if (cache && Date.now() - localStorage.getItem(`${cacheKey}_time`) < 3600000) {
                return cache;
            }
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(args)}?format=%C+%t`);
            const data = `Weather in ${args}: ${response.data}`;
            localStorage.setItem(cacheKey, data);
            localStorage.setItem(`${cacheKey}_time`, Date.now());
            return data;
        } catch {
            return `<span class="error">Failed to fetch weather for ${args}</span>`;
        }
    },
    'mkdir': (args) => {
        if (!args) return `<span class="error">Usage: mkdir [name]</span>`;
        const path = resolvePath(args);
        if (getNode(path)) return `<span class="error">Directory already exists: ${args}</span>`;
        setNode(path, {});
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        return `Directory created: ${args}`;
    },
    'touch': (args) => {
        if (!args) return `<span class="error">Usage: touch [name]</span>`;
        const path = resolvePath(args);
        if (getNode(path)) return `<span class="error">File already exists: ${args}</span>`;
        setNode(path, '');
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        return `File created: ${args}`;
    },
    'ls': () => {
        const node = getNode(currentPath);
        if (!node || typeof node !== 'object') return `<span class="error">Not a directory: ${currentPath}</span>`;
        const contents = Object.keys(node).sort();
        return contents.length ? contents.map(item => `<span class="${typeof node[item] === 'object' ? 'dir' : 'file'}">${item}</span>`).join('  ') : 'Empty directory';
    },
    'cd': (args) => {
        if (!args) {
            currentPath = '/';
            updatePrompt();
            return '';
        }
        const path = resolvePath(args);
        const node = getNode(path);
        if (!node || typeof node !== 'object') return `<span class="error">Not a directory: ${args}</span>`;
        currentPath = path;
        updatePrompt();
        return '';
    },
    'cat': (args) => {
        if (!args) return `<span class="error">Usage: cat [file]</span>`;
        const path = resolvePath(args);
        const content = getNode(path);
        if (content === null || typeof content === 'object') return `<span class="error">Not a file: ${args}</span>`;
        return `<pre>${content}</pre>`;
    },
    'rm': (args) => {
        if (!args) return `<span class="error">Usage: rm [name]</span>`;
        const path = resolvePath(args);
        if (!getNode(path)) return `<span class="error">Not found: ${args}</span>`;
        deleteNode(path);
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        return `Removed: ${args}`;
    },
    'nano': (args) => {
        if (!args) return `<span class="error">Usage: nano [file]</span>`;
        const path = resolvePath(args);
        const content = getNode(path);
        if (content === null) {
            setNode(path, '');
            localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        } else if (typeof content === 'object') {
            return `<span class="error">Not a file: ${args}</span>`;
        }
        currentFile = path;
        editorFile.textContent = `Editing: ${path}`;
        editorContent.textContent = content;
        updateEditor();
        editor.style.display = 'flex';
        input.style.display = 'none';
        output.style.display = 'none';
        editorContent.focus();
        return '';
    },
    'pwd': () => `Working directory: ${currentPath}`,
    'mv': (args) => {
        const [src, dest] = args.split(' ').filter(Boolean);
        if (!src || !dest) return `<span class="error">Usage: mv [source] [destination]</span>`;
        const srcPath = resolvePath(src);
        const destPath = resolvePath(dest);
        const srcNode = getNode(srcPath);
        if (!srcNode) return `<span class="error">Source not found: ${src}</span>`;
        if (getNode(destPath)) return `<span class="error">Destination already exists: ${dest}</span>`;
        setNode(destPath, srcNode);
        deleteNode(srcPath);
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        return `Moved: ${src} to ${dest}`;
    },
    'cp': (args) => {
        const [src, dest] = args.split(' ').filter(Boolean);
        if (!src || !dest) return `<span class="error">Usage: cp [source] [destination]</span>`;
        const srcPath = resolvePath(src);
        const destPath = resolvePath(dest);
        const srcNode = getNode(srcPath);
        if (!srcNode) return `<span class="error">Source not found: ${src}</span>`;
        if (getNode(destPath)) return `<span class="error">Destination already exists: ${dest}</span>`;
        setNode(destPath, JSON.parse(JSON.stringify(srcNode)));
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        return `Copied: ${src} to ${dest}`;
    },
    'echo': (args) => {
        if (!args) return `<span class="error">Usage: echo [text]</span>`;
        return args;
    }
};

function resolvePath(path) {
    if (path.startsWith('/')) return path.replace(/\/+/g, '/');
    const parts = currentPath === '/' ? [''] : currentPath.split('/');
    path.split('/').forEach(p => {
        if (p === '..') parts.pop();
        else if (p && p !== '.') parts.push(p);
    });
    return parts.join('/') || '/';
}

function getNode(path) {
    if (path === '/') return fileSystem['/'] || {};
    const parts = path.split('/').filter(p => p);
    let node = fileSystem['/'];
    for (const part of parts) {
        if (!node[part]) return null;
        node = node[part];
    }
    return node;
}

function setNode(path, value) {
    if (path === '/') {
        fileSystem['/'] = value;
        return;
    }
    const parts = path.split('/').filter(p => p);
    let node = fileSystem['/'];
    for (const part of parts.slice(0, -1)) {
        if (!node[part]) node[part] = {};
        node = node[part];
    }
    node[parts[parts.length - 1]] = value;
}

function deleteNode(path) {
    if (path === '/') return;
    const parts = path.split('/').filter(p => p);
    let node = fileSystem['/'];
    for (const part of parts.slice(0, -1)) {
        if (!node[part]) return;
        node = node[part];
    }
    delete node[parts[parts.length - 1]];
}

function updatePrompt() {
    prompt.textContent = `user@terminal-web:${currentPath}$ `;
}

function updateLineNumbers() {
    const lines = editorContent.textContent.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
}

function updateEditor() {
    updateLineNumbers();
    const ext = currentFile.split('.').pop().toLowerCase();
    const langMap = { js: 'javascript', py: 'python', html: 'html', css: 'css', ts: 'typescript', json: 'json', sh: 'bash' };
    const lang = langMap[ext] || 'plaintext';
    editorContent.className = `language-${lang}`;
    editorStatus.textContent = `File: ${currentFile} | Language: ${lang}`;
    hljs.highlightElement(editorContent);
}

function addOutput(text) {
    if (text) {
        const line = document.createElement('div');
        line.className = 'output-line';
        line.innerHTML = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
}

async function executeCommand(command) {
    command = command.trim().toLowerCase();
    if (!command) return;
    const [cmd, ...args] = command.replace(/^\//, '').split(' ');
    addOutput(`${prompt.textContent}${command}`);
    if (commands[cmd]) {
        addOutput('<span style="color: #888">Executing...</span>');
        const result = await (typeof commands[cmd] === 'function' ? commands[cmd](args.join(' ')) : commands[cmd]);
        output.lastChild.remove();
        addOutput(result);
    } else {
        addOutput(`<span class="error">Command not found: ${cmd}. Type help for available commands.</span>`);
    }
    history.push(command);
    localStorage.setItem('commandHistory', JSON.stringify(history.slice(-100)));
    historyIndex = history.length;
    input.value = '';
    suggestions.style.display = 'none';
}

function showSuggestions(value) {
    suggestions.innerHTML = '';
    if (!value) {
        suggestions.style.display = 'none';
        return;
    }
    const matches = Object.keys(commands).filter(cmd => cmd.startsWith(value.replace(/^\//, '').toLowerCase()));
    if (matches.length) {
        matches.forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'suggestion';
            div.textContent = cmd;
            div.onclick = () => {
                input.value = cmd;
                suggestions.style.display = 'none';
                input.focus();
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    } else {
        suggestions.style.display = 'none';
    }
}

function saveFile() {
    if (currentFile) {
        setNode(currentFile, editorContent.textContent);
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
        addOutput(`Saved: ${currentFile}`);
        closeEditor();
    }
}

function closeEditor() {
    editor.style.display = 'none';
    input.style.display = 'block';
    output.style.display = 'block';
    input.focus();
    currentFile = null;
}

function toggleTheme() {
    const themes = ['dark', 'light', 'hacker', 'retro'];
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    document.body.className = `theme-${nextTheme}`;
    currentTheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    addOutput(`Theme changed to ${nextTheme}`);
}

function toggleFullscreen() {
    document.body.classList.toggle('fullscreen');
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        await executeCommand(input.value);
    } else if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex] || '';
        }
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex];
        } else {
            historyIndex = history.length;
            input.value = '';
        }
        e.preventDefault();
    } else if (e.key === 'Tab') {
        showSuggestions(input.value);
        e.preventDefault();
    }
});

input.addEventListener('input', () => showSuggestions(input.value));

editorContent.addEventListener('input', () => {
    updateLineNumbers();
    hljs.highlightElement(editorContent);
});

editorContent.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
    } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
});

window.addEventListener('load', () => {
    if (!fileSystem['/'] || typeof fileSystem['/'] !== 'object') {
        fileSystem = { '/': {} };
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
    }
    input.focus();
    document.body.className = `theme-${currentTheme}`;
    updatePrompt();
    addOutput('Welcome to Terminal-Web! Type <span style="color: #00ffcc">help</span> to see available commands.');
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        executeCommand('clear');
        e.preventDefault();
    }
});
