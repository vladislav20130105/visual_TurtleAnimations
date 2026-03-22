// Инициализация CodeMirror
let editor;
let isRunning = false;
let pyodide;

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

    // Загружаем Pyodide
    loadPyodide();
});

// Загрузка Pyodide
async function loadPyodide() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const runBtn = document.getElementById('runBtn');
    
    try {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        
        // Устанавливаем matplotlib
        await pyodide.loadPackage(['matplotlib']);
        
        console.log('Pyodide загружен успешно');
        
        // Скрываем индикатор загрузки
        loadingIndicator.classList.add('hidden');
        runBtn.disabled = false;
        
    } catch (error) {
        console.error('Ошибка загрузки Pyodide:', error);
        const output = document.getElementById('output');
        output.innerHTML = '❌ Ошибка загрузки Python интерпретатора: ' + error.message;
        output.className = 'output error';
        
        loadingIndicator.innerHTML = '❌ Ошибка загрузки';
    }
}

// Запуск кода
async function runCode() {
    if (isRunning) return;
    
    const runBtn = document.getElementById('runBtn');
    const output = document.getElementById('output');
    const code = editor.getValue();
    
    if (!pyodide) {
        output.innerHTML = '⏳ Python интерпретатор еще не загружен. Подождите...';
        output.className = 'output error';
        return;
    }
    
    isRunning = true;
    runBtn.innerHTML = '<span class="loading"></span> Выполнение...';
    runBtn.disabled = true;
    
    output.innerHTML = '';
    output.className = 'output';
    
    try {
        // Очищаем холст
        clearCanvas();
        
        // Выполняем Python код
        await pyodide.runPythonAsync(`
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Создаем фигуру
fig, ax = plt.subplots(figsize=(4, 4))
ax.set_xlim(-200, 200)
ax.set_ylim(-200, 200)
ax.set_aspect('equal')
ax.axis('off')

# Простая эмуляция turtle
class SimpleTurtle:
    def __init__(self):
        self.x = 0
        self.y = 0
        self.angle = 0
        self.pen_down = True
        self.color = 'black'
        self.pensize = 1
        self.speed = 5
        self.lines = []
    
    def forward(self, distance):
        new_x = self.x + distance * np.cos(np.radians(self.angle))
        new_y = self.y + distance * np.sin(np.radians(self.angle))
        
        if self.pen_down:
            self.lines.append([(self.x, self.y), (new_x, new_y)])
        
        self.x = new_x
        self.y = new_y
    
    def backward(self, distance):
        self.forward(-distance)
    
    def right(self, angle):
        self.angle -= angle
    
    def left(self, angle):
        self.angle += angle
    
    def penup(self):
        self.pen_down = False
    
    def pendown(self):
        self.pen_down = True
    
    def color(self, c):
        self.color = c
    
    def pensize(self, size):
        self.pensize = size
    
    def speed(self, s):
        self.speed = s
    
    def goto(self, x, y):
        if self.pen_down:
            self.lines.append([(self.x, self.y), (x, y)])
        self.x = x
        self.y = y
    
    def draw_lines(self):
        for line in self.lines:
            x_coords = [point[0] for point in line]
            y_coords = [point[1] for point in line]
            ax.plot(x_coords, y_coords, color=self.color, linewidth=self.pensize)

# Создаем черепашку
t = SimpleTurtle()

# Выполняем пользовательский код
try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"Ошибка: {e}")

# Рисуем все линии
t.draw_lines()

# Сохраняем в буфер обмена
import io
buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
buf.seek(0)
`);

        // Получаем изображение
        const imageData = pyodide.runPython(`
buf.getvalue()
`);
        
        // Создаем blob и отображаем
        const blob = new Blob([imageData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
        
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
