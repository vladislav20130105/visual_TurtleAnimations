// Инициализация CodeMirror
let editor;
let isRunning = false;

// Переменные для масштабирования и перемещения
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

// Примеры кода
const examples = {
    square: `# Рисуем квадрат
t.forward(100)
t.right(90)
t.forward(100)
t.right(90)
t.forward(100)
t.right(90)
t.forward(100)`,

    star: `# Рисуем звезду
t.color("gold")
t.pensize(2)

for i in range(5):
    t.forward(200)
    t.right(144)`,

    spiral: `# Рисуем спираль
colors = ["red", "purple", "blue", "green", "orange", "yellow"]
t.pensize(2)

for i in range(50):
    t.pencolor(colors[i % len(colors)])
    t.forward(i * 4)
    t.right(91)`,

    flower: `# Рисуем цветок
t.pensize(2)

# Цветок
for i in range(36):
    t.circle(50)
    t.right(10)

# Стебель
t.right(90)
t.forward(200)`,

    rainbow: `# Рисуем радугу
t.pensize(5)
t.speed(10)

colors = ["red", "orange", "yellow", "green", "blue", "purple"]
size = 150

for color in colors:
    t.pencolor(color)
    t.circle(size)
    size -= 25`
};

// Класс Turtle эмуляции с большим холстом
class SimpleTurtle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angle = -90; // вверх
        this.penDown = true;
        this.color = 'black';
        this.lineWidth = 1;
        this.speed = 5;
        this.hidden = false;
        this.bgcolor = 'white';
        this.tracerEnabled = true;
        
        this.reset();
    }
    
    reset() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.bgcolor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = -90;
    }
    
    setheading(degrees) {
        this.angle = degrees;
    }
    
    forward(distance) {
        const radians = this.angle * Math.PI / 180;
        const newX = this.x + distance * Math.cos(radians);
        const newY = this.y + distance * Math.sin(radians);
        
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(newX, newY);
            this.ctx.stroke();
        }
        
        this.x = newX;
        this.y = newY;
    }
    
    backward(distance) {
        this.forward(-distance);
    }
    
    right(degrees) {
        this.angle += degrees;
    }
    
    left(degrees) {
        this.angle -= degrees;
    }
    
    penup() {
        this.penDown = false;
    }
    
    pendown() {
        this.penDown = true;
    }
    
    pencolor(color) {
        this.color = color;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
    }
    
    pensize(width) {
        this.lineWidth = width;
        this.ctx.lineWidth = width;
    }
    
    speed(s) {
        this.speed = s;
    }
    
    goto(x, y) {
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
        this.x = x;
        this.y = y;
    }
    
    circle(radius) {
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, Math.abs(radius), 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    dot(size) {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, size / 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    write(text, align = 'left', font = null) {
        this.ctx.font = font || '16px Arial';
        this.ctx.textAlign = align;
        this.ctx.fillText(text, this.x, this.y);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.bgcolor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    bgcolor(color) {
        this.bgcolor = color;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.color;
    }
    
    hideturtle() {
        this.hidden = true;
    }
    
    showturtle() {
        this.hidden = false;
    }
    
    setup(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.x = width / 2;
        this.y = height / 2;
        this.reset();
    }
    
    tracer(n) {
        this.tracerEnabled = (n === 0);
    }
    
    update() {
        // В браузере обновление происходит автоматически
    }
    
    done() {
        // В браузере не нужно
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем CodeMirror
    editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        lineWrapping: true,
        autofocus: true
    });

    // Обработчики кнопок
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('examples').addEventListener('change', loadExample);
    
    // Обработчики масштабирования
    document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
    
    // Обработчики перемещения холста
    setupCanvasPan();
    setupWheelZoom();
});

// Настройка перемещения холста
function setupCanvasPan() {
    const canvasContainer = document.querySelector('.canvas-container');
    
    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.target === canvasContainer || e.target.id === 'canvas') {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            canvasContainer.style.cursor = 'grabbing';
            e.preventDefault(); // Предотвращаем выделение текста
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Используем requestAnimationFrame для плавности
        requestAnimationFrame(() => {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateCanvasTransform();
        });
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.style.cursor = 'grab';
    });
    
    // Предотвращаем уход курсора за пределы окна
    document.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            const canvasContainer = document.querySelector('.canvas-container');
            canvasContainer.style.cursor = 'grab';
        }
    });
}

// Настройка масштабирования колесом мыши
function setupWheelZoom() {
    const canvasContainer = document.querySelector('.canvas-container');
    
    canvasContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = scale * delta;
        
        if (newScale >= 0.1 && newScale <= 5) {
            scale = newScale;
            updateCanvasTransform();
            updateZoomInfo();
        }
    });
}

// Обновление трансформации холста
function updateCanvasTransform() {
    const canvas = document.getElementById('canvas');
    // Применяем трансформацию мгновенно без задержки
    requestAnimationFrame(() => {
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    });
}

// Масштабирование
function zoomIn() {
    if (scale < 5) {
        scale *= 1.2;
        updateCanvasTransform();
        updateZoomInfo();
    }
}

function zoomOut() {
    if (scale > 0.1) {
        scale /= 1.2;
        updateCanvasTransform();
        updateZoomInfo();
    }
}

function resetView() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateCanvasTransform();
    updateZoomInfo();
}

function updateZoomInfo() {
    const zoomLevel = document.getElementById('zoomLevel');
    zoomLevel.textContent = Math.round(scale * 100) + '%';
}

// Запуск кода
function runCode() {
    if (isRunning) return;
    
    const runBtn = document.getElementById('runBtn');
    const output = document.getElementById('output');
    const code = editor.getValue();
    
    isRunning = true;
    runBtn.innerHTML = '<span class="loading"></span> Выполнение...';
    runBtn.disabled = true;
    
    output.innerHTML = '';
    output.className = 'output';
    
    try {
        // Очищаем холст
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Создаем черепашку
        const t = new SimpleTurtle(canvas);
        
        // Простой парсер Python кода
        executeTurtleCode(code, t);
        
        output.innerHTML = '✅ Код успешно выполнен! Используйте мышь для перемещения и масштабирования.';
        output.className = 'output success';
        
    } catch (error) {
        output.innerHTML = `❌ Ошибка: ${error.message}`;
        output.className = 'output error';
    } finally {
        isRunning = false;
        runBtn.innerHTML = '▶ Запустить';
        runBtn.disabled = false;
    }
}

// Выполнение turtle кода
function executeTurtleCode(code, turtle) {
    // Создаем упрощенные версии random и math
    const random = {
        randint: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        uniform: (min, max) => Math.random() * (max - min) + min,
        choice: (arr) => arr[Math.floor(Math.random() * arr.length)]
    };
    
    const math = {
        sin: Math.sin,
        cos: Math.cos,
        radians: (deg) => deg * Math.PI / 180,
        pi: Math.PI
    };
    
    // Удаляем import и другие ненужные строки
    const lines = code.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        
        // Пропускаем комментарии и пустые строки
        if (line.startsWith('#') || line === '') continue;
        
        // Пропускаем import
        if (line.startsWith('import ') || line.startsWith('from ')) continue;
        
        // Удаляем turtle.done()
        if (line.includes('turtle.done()') || line.includes('done()')) continue;
        
        // Заменяем random. функции
        line = line.replace(/random\.randint\(([^,]+),\s*([^)]+)\)/g, (match, min, max) => {
            return random.randint(parseInt(min), parseInt(max));
        });
        
        line = line.replace(/random\.uniform\(([^,]+),\s*([^)]+)\)/g, (match, min, max) => {
            return random.uniform(parseFloat(min), parseFloat(max));
        });
        
        line = line.replace(/random\.choice\(([^)]+)\)/g, (match, arr) => {
            // Простая реализация для массивов строк
            const arrMatch = arr.match(/\[(.*?)\]/);
            if (arrMatch) {
                const items = arrMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
                return `"${random.choice(items)}"`;
            }
            return '"white"';
        });
        
        // Заменяем math. функции
        line = line.replace(/math\.sin\(([^)]+)\)/g, (match, val) => {
            return math.sin(parseFloat(val));
        });
        
        line = line.replace(/math\.cos\(([^)]+)\)/g, (match, val) => {
            return math.cos(parseFloat(val));
        });
        
        line = line.replace(/math\.radians\(([^)]+)\)/g, (match, deg) => {
            return math.radians(parseFloat(deg));
        });
        
        line = line.replace(/math\.pi/g, math.pi);
        
        // Парсим команды
        try {
            parseAndExecute(line, turtle);
        } catch (error) {
            console.warn('Ошибка в строке:', line, error);
        }
    }
}

// Парсер и исполнитель команд
function parseAndExecute(line, turtle) {
    // t.forward(100) или forward(100)
    const forwardMatch = line.match(/(?:t\.)?forward\(([^)]+)\)/);
    if (forwardMatch) {
        turtle.forward(eval(forwardMatch[1]));
        return;
    }
    
    // t.backward(100) или backward(100)
    const backwardMatch = line.match(/(?:t\.)?backward\(([^)]+)\)/);
    if (backwardMatch) {
        turtle.backward(eval(backwardMatch[1]));
        return;
    }
    
    // t.right(90) или right(90)
    const rightMatch = line.match(/(?:t\.)?right\(([^)]+)\)/);
    if (rightMatch) {
        turtle.right(eval(rightMatch[1]));
        return;
    }
    
    // t.left(90) или left(90)
    const leftMatch = line.match(/(?:t\.)?left\(([^)]+)\)/);
    if (leftMatch) {
        turtle.left(eval(leftMatch[1]));
        return;
    }
    
    // t.setheading(90) или setheading(90)
    const setheadingMatch = line.match(/(?:t\.)?setheading\(([^)]+)\)/);
    if (setheadingMatch) {
        turtle.setheading(eval(setheadingMatch[1]));
        return;
    }
    
    // t.pencolor("red") или pencolor("red")
    const colorMatch = line.match(/(?:t\.)?pencolor\(["']([^"']+)["']\)/);
    if (colorMatch) {
        turtle.pencolor(colorMatch[1]);
        return;
    }
    
    // t.pensize(3) или pensize(3)
    const sizeMatch = line.match(/(?:t\.)?pensize\(([^)]+)\)/);
    if (sizeMatch) {
        turtle.pensize(eval(sizeMatch[1]));
        return;
    }
    
    // t.speed(5) или speed(5)
    const speedMatch = line.match(/(?:t\.)?speed\(([^)]+)\)/);
    if (speedMatch) {
        turtle.speed(eval(speedMatch[1]));
        return;
    }
    
    // t.circle(50) или circle(50)
    const circleMatch = line.match(/(?:t\.)?circle\(([^)]+)\)/);
    if (circleMatch) {
        turtle.circle(eval(circleMatch[1]));
        return;
    }
    
    // t.dot(10) или dot(10)
    const dotMatch = line.match(/(?:t\.)?dot\(([^)]+)\)/);
    if (dotMatch) {
        turtle.dot(eval(dotMatch[1]));
        return;
    }
    
    // t.write("text") или write("text")
    const writeMatch = line.match(/(?:t\.)?write\(["']([^"']+)["'][^)]*\)/);
    if (writeMatch) {
        turtle.write(writeMatch[1]);
        return;
    }
    
    // t.goto(x, y) или goto(x, y)
    const gotoMatch = line.match(/(?:t\.)?goto\(([^,]+),\s*([^)]+)\)/);
    if (gotoMatch) {
        turtle.goto(eval(gotoMatch[1]), eval(gotoMatch[2]));
        return;
    }
    
    // t.penup() или penup()
    if (line.includes('penup()') || line.includes('t.penup()')) {
        turtle.penup();
        return;
    }
    
    // t.pendown() или pendown()
    if (line.includes('pendown()') || line.includes('t.pendown()')) {
        turtle.pendown();
        return;
    }
    
    // clear()
    if (line.includes('clear()')) {
        turtle.clear();
        return;
    }
    
    // bgcolor("color")
    const bgcolorMatch = line.match(/bgcolor\(["']([^"']+)["']\)/);
    if (bgcolorMatch) {
        turtle.bgcolor(bgcolorMatch[1]);
        return;
    }
    
    // hideturtle()
    if (line.includes('hideturtle()')) {
        turtle.hideturtle();
        return;
    }
    
    // setup(width, height)
    const setupMatch = line.match(/setup\(([^,]+),\s*([^)]+)\)/);
    if (setupMatch) {
        turtle.setup(eval(setupMatch[1]), eval(setupMatch[2]));
        return;
    }
    
    // tracer(0)
    if (line.includes('tracer(0)')) {
        turtle.tracer(0);
        return;
    }
    
    // update()
    if (line.includes('update()')) {
        turtle.update();
        return;
    }
    
    // done()
    if (line.includes('done()')) {
        turtle.done();
        return;
    }
}

// Очистка всего
function clearAll() {
    // Очищаем холст
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Очищаем код
    editor.setValue('');
    
    // Очищаем выходные сообщения
    const output = document.getElementById('output');
    output.innerHTML = '';
    output.className = 'output';
    
    // Сбрасываем пример
    document.getElementById('examples').value = '';
    
    // Сбрасываем масштаб
    resetView();
}

// Загрузка примера
function loadExample(event) {
    const exampleName = event.target.value;
    if (exampleName && examples[exampleName]) {
        editor.setValue(`import turtle

# Создаем черепашку
t = turtle.Turtle()
t.speed(5)

${examples[exampleName]}

# Завершаем рисование
turtle.done()`);
        document.getElementById('output').innerHTML = '';
    }
}

// Горячие клавиши
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter для запуска кода
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        runCode();
    }
    
    // Ctrl+L для очистки всего
    if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        clearAll();
    }
    
    // Ctrl+плюс для масштабирования
    if (event.ctrlKey && event.key === '+') {
        event.preventDefault();
        zoomIn();
    }
    
    // Ctrl+минус для масштабирования
    if (event.ctrlKey && event.key === '-') {
        event.preventDefault();
        zoomOut();
    }
    
    // Ctrl+0 для сброса масштаба
    if (event.ctrlKey && event.key === '0') {
        event.preventDefault();
        resetView();
    }
});
