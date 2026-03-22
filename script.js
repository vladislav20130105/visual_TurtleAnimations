// Инициализация CodeMirror
let editor;
let isRunning = false;

// Примеры кода
const examples = {
    square: `# Рисуем квадрат
import turtle

t = turtle.Turtle()
t.speed(5)
t.pensize(3)

for i in range(4):
    t.forward(100)
    t.right(90)

turtle.done()`,

    star: `# Рисуем звезду
import turtle

t = turtle.Turtle()
t.speed(5)
t.color("gold")
t.pensize(2)

for i in range(5):
    t.forward(200)
    t.right(144)

turtle.done()`,

    spiral: `# Рисуем спираль
import turtle

t = turtle.Turtle()
t.speed(10)
t.pensize(2)

colors = ["red", "purple", "blue", "green", "orange", "yellow"]

for i in range(50):
    t.pencolor(colors[i % len(colors)])
    t.forward(i * 4)
    t.right(91)

turtle.done()`,

    flower: `# Рисуем цветок
import turtle

t = turtle.Turtle()
t.speed(10)
t.pensize(2)

# Цветок
for i in range(36):
    t.circle(50)
    t.right(10)

# Стебель
t.right(90)
t.forward(200)

turtle.done()`,

    rainbow: `# Рисуем радугу
import turtle

t = turtle.Turtle()
t.speed(10)
t.pensize(5)

colors = ["red", "orange", "yellow", "green", "blue", "purple"]
size = 150

for color in colors:
    t.pencolor(color)
    t.circle(size)
    size -= 25

turtle.done()`
};

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

    // Настраиваем Skulpt
    configureSkulpt();
});

// Настройка Skulpt
function configureSkulpt() {
    Sk.configure({
        output: function(text) {
            const output = document.getElementById('output');
            output.innerHTML += text;
        },
        read: function(x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
        },
        retaintype: true,
        debug: false,
        execLimit: 10000
    });
}

// Запуск кода
async function runCode() {
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
        
        // Выполняем Python код
        await executePythonCode(code);
        
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

// Выполнение Python кода
function executePythonCode(code) {
    return new Promise((resolve, reject) => {
        try {
            // Проверяем, что Skulpt загружен
            if (typeof Sk === 'undefined') {
                throw new Error('Skulpt не загружен. Пожалуйста, обновите страницу.');
            }
            
            // Создаем модифицированный код для turtle
            const modifiedCode = `
import turtle
import sys

# Создаем черепашку
t = turtle.Turtle()
t.speed(5)

# Выполняем пользовательский код
${code}

# Завершаем
turtle.done()
`;
            
            // Выполняем код через Skulpt
            Sk.misceval.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>", false, modifiedCode, true);
            }).then(function() {
                resolve();
            }, function(error) {
                reject(new Error(error.toString()));
            });
            
        } catch (error) {
            reject(error);
        }
    });
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
        editor.setValue(examples[exampleName]);
        document.getElementById('output').innerHTML = '';
    }
}

// Обработка ошибок turtle
window.addEventListener('error', function(event) {
    const output = document.getElementById('output');
    output.innerHTML = `❌ Ошибка выполнения: ${event.message}`;
    output.className = 'output error';
    
    isRunning = false;
    const runBtn = document.getElementById('runBtn');
    runBtn.innerHTML = '▶ Запустить';
    runBtn.disabled = false;
});

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
