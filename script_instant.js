// Инициализация CodeMirror
let editor;
let isRunning = false;

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

// Класс Turtle эмуляции
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
        
        this.reset();
    }
    
    reset() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = -90;
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
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('examples').addEventListener('change', loadExample);
});

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
        clearCanvas();
        
        // Создаем черепашку
        const canvas = document.getElementById('canvas');
        const t = new SimpleTurtle(canvas);
        
        // Простой парсер Python кода
        executeTurtleCode(code, t);
        
        output.innerHTML = '✅ Код успешно выполнен!';
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
    // Удаляем import и другие ненужные строки
    const lines = code.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        
        // Пропускаем комментарии и пустые строки
        if (line.startsWith('#') || line === '') continue;
        
        // Пропускаем import
        if (line.startsWith('import ') || line.startsWith('from ')) continue;
        
        // Удаляем turtle.done()
        if (line.includes('turtle.done()')) continue;
        
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
    const forwardMatch = line.match(/(?:t\.)?forward\((\d+)\)/);
    if (forwardMatch) {
        turtle.forward(parseInt(forwardMatch[1]));
        return;
    }
    
    // t.backward(100) или backward(100)
    const backwardMatch = line.match(/(?:t\.)?backward\((\d+)\)/);
    if (backwardMatch) {
        turtle.backward(parseInt(backwardMatch[1]));
        return;
    }
    
    // t.right(90) или right(90)
    const rightMatch = line.match(/(?:t\.)?right\((\d+)\)/);
    if (rightMatch) {
        turtle.right(parseInt(rightMatch[1]));
        return;
    }
    
    // t.left(90) или left(90)
    const leftMatch = line.match(/(?:t\.)?left\((\d+)\)/);
    if (leftMatch) {
        turtle.left(parseInt(leftMatch[1]));
        return;
    }
    
    // t.pencolor("red") или pencolor("red")
    const colorMatch = line.match(/(?:t\.)?pencolor\(["']([^"']+)["']\)/);
    if (colorMatch) {
        turtle.pencolor(colorMatch[1]);
        return;
    }
    
    // t.pensize(3) или pensize(3)
    const sizeMatch = line.match(/(?:t\.)?pensize\((\d+)\)/);
    if (sizeMatch) {
        turtle.pensize(parseInt(sizeMatch[1]));
        return;
    }
    
    // t.speed(5) или speed(5)
    const speedMatch = line.match(/(?:t\.)?speed\((\d+)\)/);
    if (speedMatch) {
        turtle.speed(parseInt(speedMatch[1]));
        return;
    }
    
    // t.circle(50) или circle(50)
    const circleMatch = line.match(/(?:t\.)?circle\((\d+)\)/);
    if (circleMatch) {
        turtle.circle(parseInt(circleMatch[1]));
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
    
    // Циклы for
    const forMatch = line.match(/for i in range\((\d+)\):/);
    if (forMatch) {
        // Это упрощенная версия - только для демонстрации
        return;
    }
}

// Очистка холста
function clearCanvas() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Сброс всего
function resetAll() {
    clearCanvas();
    editor.setValue(`# Python Turtle код
import turtle

# Создаем черепашку
t = turtle.Turtle()
t.speed(5)

# Рисуем квадрат
for i in range(4):
    t.forward(100)
    t.right(90)

# Завершаем рисование
turtle.done()`);
    
    document.getElementById('output').innerHTML = '';
    document.getElementById('examples').value = '';
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
    
    // Ctrl+L для очистки
    if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        clearCanvas();
    }
    
    // Ctrl+R для сброса
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        resetAll();
    }
});
