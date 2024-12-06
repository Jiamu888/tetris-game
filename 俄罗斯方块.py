import pygame
import random

# 初始化pygame
pygame.init()

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
CYAN = (0, 255, 255)
YELLOW = (255, 255, 0)
MAGENTA = (255, 0, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
GRAY = (128, 128, 128)

# 方块形状定义
SHAPES = [
    [[1, 1, 1, 1]],  # I
    [[1, 1], [1, 1]],  # O
    [[1, 1, 1], [0, 1, 0]],  # T
    [[1, 1, 1], [1, 0, 0]],  # L
    [[1, 1, 1], [0, 0, 1]],  # J
    [[1, 1, 0], [0, 1, 1]],  # S
    [[0, 1, 1], [1, 1, 0]]   # Z
]

# 方块颜色
SHAPE_COLORS = [CYAN, YELLOW, MAGENTA, BLUE, RED, GREEN, BLUE]

# 游戏区域设置
BLOCK_SIZE = 30
GRID_WIDTH = 10
GRID_HEIGHT = 20
score = 0
level = 1
lines_cleared_total = 0

# 设置游戏窗口
SCREEN_WIDTH = BLOCK_SIZE * (GRID_WIDTH + 8)
SCREEN_HEIGHT = BLOCK_SIZE * GRID_HEIGHT
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('俄罗斯方块')

# 初始化字体
pygame.font.init()
font = pygame.font.Font(None, 36)

# 游戏网格
grid = [[0 for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
colors = [[0 for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]

class Tetromino:
    def __init__(self):
        self.shape_index = random.randint(0, len(SHAPES) - 1)
        self.shape = SHAPES[self.shape_index]
        self.color = SHAPE_COLORS[self.shape_index]
        self.x = GRID_WIDTH // 2 - len(self.shape[0]) // 2
        self.y = 0

    def draw(self):
        for i in range(len(self.shape)):
            for j in range(len(self.shape[0])):
                if self.shape[i][j]:
                    pygame.draw.rect(screen, self.color,
                                   (BLOCK_SIZE * (self.x + j),
                                    BLOCK_SIZE * (self.y + i),
                                    BLOCK_SIZE - 1, BLOCK_SIZE - 1))

def check_collision(piece, grid, x, y):
    for i in range(len(piece.shape)):
        for j in range(len(piece.shape[0])):
            if piece.shape[i][j]:
                if (y + i >= GRID_HEIGHT or 
                    x + j < 0 or 
                    x + j >= GRID_WIDTH or 
                    grid[y + i][x + j]):
                    return True
    return False

def lock_piece(piece, grid, colors):
    for i in range(len(piece.shape)):
        for j in range(len(piece.shape[0])):
            if piece.shape[i][j]:
                grid[piece.y + i][piece.x + j] = 1
                colors[piece.y + i][piece.x + j] = piece.color

def clear_lines(grid, colors):
    global score, level, lines_cleared_total, fall_speed
    
    lines_cleared = 0
    for i in range(GRID_HEIGHT - 1, -1, -1):
        if all(grid[i]):
            del grid[i]
            del colors[i]
            grid.insert(0, [0 for _ in range(GRID_WIDTH)])
            colors.insert(0, [0 for _ in range(GRID_WIDTH)])
            lines_cleared += 1
    
    # 计算分数
    if lines_cleared == 1:
        score += 100 * level
    elif lines_cleared == 2:
        score += 300 * level
    elif lines_cleared == 3:
        score += 500 * level
    elif lines_cleared == 4:
        score += 800 * level
    
    # 更新总消行数和等级
    lines_cleared_total += lines_cleared
    level = lines_cleared_total // 10 + 1
    
    # 根据等级调整下落速度
    fall_speed = max(0.1, 0.5 - (level - 1) * 0.05)

def draw_grid(grid, colors):
    for i in range(GRID_HEIGHT):
        for j in range(GRID_WIDTH):
            if grid[i][j]:
                pygame.draw.rect(screen, colors[i][j],
                               (BLOCK_SIZE * j,
                                BLOCK_SIZE * i,
                                BLOCK_SIZE - 1, BLOCK_SIZE - 1))

def draw_info():
    # 绘制右侧信息区域
    info_x = BLOCK_SIZE * (GRID_WIDTH + 1)
    
    # 显示分数
    score_text = font.render(f'分数: {score}', True, WHITE)
    screen.blit(score_text, (info_x, 20))
    
    # 显示等级
    level_text = font.render(f'等级: {level}', True, WHITE)
    screen.blit(level_text, (info_x, 60))
    
    # 显示下一个方块提示
    next_text = font.render('下一个:', True, WHITE)
    screen.blit(next_text, (info_x, 120))

# 创建当前方块
current_piece = Tetromino()
fall_time = 0
fall_speed = 0.5

# 游戏主循环
running = True
clock = pygame.time.Clock()

while running:
    fall_time += clock.get_rawtime()
    clock.tick()

    # 方块自动下落
    if fall_time/1000 >= fall_speed:
        current_piece.y += 1
        if check_collision(current_piece, grid, current_piece.x, current_piece.y):
            current_piece.y -= 1
            lock_piece(current_piece, grid, colors)
            clear_lines(grid, colors)
            current_piece = Tetromino()
            if check_collision(current_piece, grid, current_piece.x, current_piece.y):
                running = False
        fall_time = 0

    # 处理事件
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                current_piece.x -= 1
                if check_collision(current_piece, grid, current_piece.x, current_piece.y):
                    current_piece.x += 1
            if event.key == pygame.K_RIGHT:
                current_piece.x += 1
                if check_collision(current_piece, grid, current_piece.x, current_piece.y):
                    current_piece.x -= 1
            if event.key == pygame.K_DOWN:
                current_piece.y += 1
                if check_collision(current_piece, grid, current_piece.x, current_piece.y):
                    current_piece.y -= 1
            if event.key == pygame.K_UP:  # 添加旋转功能
                original_shape = current_piece.shape
                current_piece.shape = list(zip(*current_piece.shape[::-1]))
                if check_collision(current_piece, grid, current_piece.x, current_piece.y):
                    current_piece.shape = original_shape
        
    # 填充黑色背景
    screen.fill(BLACK)
    
    # 绘制已固定的方块
    draw_grid(grid, colors)
    
    # 绘制游戏区域边框
    pygame.draw.rect(screen, WHITE, (0, 0, BLOCK_SIZE * GRID_WIDTH, SCREEN_HEIGHT), 1)
    
    # 绘制当前方块
    current_piece.draw()
    
    # 绘制信息
    draw_info()
    
    # 更新显示
    pygame.display.flip()

pygame.quit()
