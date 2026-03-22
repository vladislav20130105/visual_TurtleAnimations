from flask import Flask, render_template, request, jsonify
import base64
from io import BytesIO
import math

app = Flask(__name__)

class SimpleTurtle:
    def __init__(self):
        self.x = 400
        self.y = 400
        self.angle = 0
        self.pen_down = True
        self.color = "black"
        self.width = 1
        self.lines = []
        self.dots = []
        
    def forward(self, distance):
        new_x = self.x + distance * math.cos(math.radians(self.angle))
        new_y = self.y + distance * math.sin(math.radians(self.angle))
        
        if self.pen_down:
            self.lines.append({
                'start': (self.x, self.y),
                'end': (new_x, new_y),
                'color': self.color,
                'width': self.width
            })
        
        self.x = new_x
        self.y = new_y
    
    def backward(self, distance):
        self.forward(-distance)
    
    def right(self, degrees):
        self.angle -= degrees
    
    def left(self, degrees):
        self.angle += degrees
    
    def penup(self):
        self.pen_down = False
    
    def pendown(self):
        self.pen_down = True
    
    def pencolor(self, color):
        self.color = color
    
    def pensize(self, width):
        self.width = width
    
    def speed(self, speed):
        pass
    
    def goto(self, x, y):
        if self.pen_down:
            self.lines.append({
                'start': (self.x, self.y),
                'end': (x, y),
                'color': self.color,
                'width': self.width
            })
        self.x = x
        self.y = y
    
    def setheading(self, angle):
        self.angle = angle
    
    def circle(self, radius):
        if self.pen_down:
            self.dots.append({
                'type': 'circle',
                'center': (self.x, self.y),
                'radius': radius,
                'color': self.color,
                'width': self.width
            })
    
    def dot(self, size):
        self.dots.append({
            'type': 'dot',
            'pos': (self.x, self.y),
            'size': size,
            'color': self.color
        })
    
    def write(self, text, align=None, font=None):
        self.dots.append({
            'type': 'text',
            'pos': (self.x, self.y),
            'text': text,
            'color': self.color,
            'font': font
        })
    
    def hideturtle(self):
        pass
    
    def setup(self, width, height):
        self.x = width // 2
        self.y = height // 2

def create_svg_from_turtle(turtle_obj):
    svg_parts = [
        '<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">',
        '<rect width="800" height="800" fill="white"/>'
    ]
    
    # Рисуем линии
    for line in turtle_obj.lines:
        x1, y1 = line['start']
        x2, y2 = line['end']
        svg_parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{line["color"]}" stroke-width="{line["width"]}"/>')
    
    # Рисуем круги и точки
    for dot in turtle_obj.dots:
        if dot['type'] == 'circle':
            cx, cy = dot['center']
            svg_parts.append(f'<circle cx="{cx}" cy="{cy}" r="{dot["radius"]}" fill="none" stroke="{dot["color"]}" stroke-width="{dot["width"]}"/>')
        elif dot['type'] == 'dot':
            x, y = dot['pos']
            svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{dot["size"]/2}" fill="{dot["color"]}"/>')
        elif dot['type'] == 'text':
            x, y = dot['pos']
            svg_parts.append(f'<text x="{x}" y="{y}" fill="{dot["color"]}" font-family="Arial" font-size="16">{dot["text"]}</text>')
    
    svg_parts.append('</svg>')
    return ''.join(svg_parts)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_code', methods=['POST'])
def run_code():
    try:
        if not request.json:
            return jsonify({'success': False, 'error': 'No JSON data received'})
            
        code = request.json.get('code', '')
        if not code:
            return jsonify({'success': False, 'error': 'No code provided'})
        
        # Ограничиваем размер кода
        if len(code) > 10000:  # 10KB лимит
            return jsonify({'success': False, 'error': 'Code too long'})
        
        # Создаем эмуляцию turtle
        t = SimpleTurtle()
        
        # Создаем пространство для выполнения кода
        turtle_namespace = {
            'turtle': t,
            'forward': t.forward,
            'backward': t.backward,
            'right': t.right,
            'left': t.left,
            'penup': t.penup,
            'pendown': t.pendown,
            'pencolor': t.pencolor,
            'pensize': t.pensize,
            'speed': t.speed,
            'goto': t.goto,
            'setheading': t.setheading,
            'circle': t.circle,
            'dot': t.dot,
            'write': t.write,
            'hideturtle': t.hideturtle,
            'setup': t.setup,
            'bgcolor': lambda color: None,  # Заглушка
            'done': lambda: None,  # Заглушка
            'tracer': lambda n: None,  # Заглушка
            'update': lambda: None,  # Заглушка
            'clear': lambda: None,  # Заглушка - не очищает для анимации
            'random': __import__('random'),
            'math': __import__('math'),
            'time': __import__('time'),
            'range': range,
            'len': len,
            'Particle': lambda *args, **kwargs: None,  # Заглушка для класса
            'galaxy_spiral': lambda: None,  # Заглушка для отсутствующей функции
        }
        
        # Выполняем код с ограничением по времени
        import threading
        import time
        
        class TimeoutException(Exception):
            pass
        
        def run_with_timeout(code, namespace, timeout_seconds):
            result = []
            exception = []
            
            def target():
                try:
                    exec(code, namespace)
                    result.append(True)
                except Exception as e:
                    exception.append(e)
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(timeout_seconds)
            
            if thread.is_alive():
                return False, "Code execution timed out"
            elif exception:
                return False, str(exception[0])
            elif result:
                return True, None
            else:
                return False, "Code execution failed"
        
        # Выполняем код с таймаутом 3 секунды
        success, error_msg = run_with_timeout(code, turtle_namespace, 3)
        
        if not success:
            return jsonify({
                'success': False,
                'error': error_msg
            })
        
        # Создаем SVG
        svg_content = create_svg_from_turtle(t)
        
        # Проверяем размер SVG
        if len(svg_content) > 1000000:  # 1MB лимит
            svg_content = svg_content[:1000000] + '</svg>'
        
        # Конвертируем в base64
        svg_b64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
        
        return jsonify({
            'success': True,
            'image': f'data:image/svg+xml;base64,{svg_b64}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/examples')
def get_examples():
    examples = {
        'square': '''# Рисуем квадрат
forward(100)
right(90)
forward(100)
right(90)
forward(100)
right(90)
forward(100)''',
        
        'star': '''# Рисуем звезду
pencolor("gold")
for i in range(5):
    forward(200)
    right(144)''',
        
        'spiral': '''# Рисуем спираль
colors = ["red", "purple", "blue", "green", "orange", "yellow"]
for i in range(50):
    pencolor(colors[i % len(colors)])
    forward(i * 4)
    right(91)''',
        
        'flower': '''# Рисуем цветок
for i in range(36):
    circle(50)
    right(10)
right(90)
forward(200)''',
        
        'rainbow': '''# Рисуем радугу
colors = ["red", "orange", "yellow", "green", "blue", "purple"]
size = 150
for color in colors:
    pencolor(color)
    circle(size)
    size -= 25'''
    }
    
    return jsonify(examples)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
