import pygame as pg
import sys
import time
from pygame.locals import *
import os

# SET WORKING DIRECTORY TO SCRIPT LOCATION
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ---------------------- GLOBAL VARIABLES ----------------------
XO = 'x' 
winner = None
draw = None
width, height = 400, 400
white = (255, 255, 255)
line_color = (0, 0, 0)
board = [[None]*3, [None]*3, [None]*3]

# ---------------------- INITIALIZE PYGAME ----------------------
pg.init()
pg.mixer.init()

# SOUNDS
pg.mixer.music.load("pixel_party.mp3")
pg.mixer.music.play(-1)
pg.mixer.music.set_volume(0.5)
win_sound = pg.mixer.Sound("win.mp3")
click_sound = pg.mixer.Sound("click.mp3")

fps = 30
CLOCK = pg.time.Clock()
screen = pg.display.set_mode((width, height + 100), 0, 32)
pg.display.set_caption("Tic Tac Toe")

# LOAD IMAGES
initiating_window = pg.image.load("modified_cover.png")
game_background = pg.image.load("game_bg.png") 
x_img = pg.image.load("X_modified.png")
o_img = pg.image.load("o_modified.png") 

# SCALE IMAGES
initiating_window = pg.transform.scale(initiating_window, (width, height + 100))
game_background = pg.transform.scale(game_background, (width, height))
x_img = pg.transform.scale(x_img, (80, 80))
o_img = pg.transform.scale(o_img, (80, 80)) 

# ---------------------- FUNCTIONS ----------------------

def show_welcome():
    screen.blit(initiating_window, (0, 0))
    title_font = pg.font.Font(None, 45)
    title_text = title_font.render("WELCOME TO TICTACTOE", True, white)
    screen.blit(title_text, (15, 50))

    font = pg.font.Font(None, 40)
    # Start Button Rect
    start_rect = pg.draw.rect(screen, (0, 150, 0), (80, height, 110, 40))
    screen.blit(font.render("START", True, white), (90, height + 5))

    # Exit Button Rect
    exit_rect = pg.draw.rect(screen, (200, 0, 0), (220, height, 110, 40))
    screen.blit(font.render("EXIT", True, white), (245, height + 5))
    pg.display.update()

    while True:
        for event in pg.event.get():
            if event.type == QUIT:
                pg.quit()
                sys.exit()
            if event.type == MOUSEBUTTONDOWN:
                mx, my = pg.mouse.get_pos()
                if 80 <= mx <= 190 and height <= my <= height + 40:
                    choose_character() # Transition to character selection
                    return # Exit welcome and proceed to game window
                if 220 <= mx <= 330 and height <= my <= height + 40:
                    pg.quit()
                    sys.exit()

def choose_character():
    global XO
    screen.fill((30, 30, 30)) # Dark background for selection
    font = pg.font.Font(None, 35)
    text = font.render("PLAYER 1: CHOOSE ICON", True, white)
    screen.blit(text, (width // 2 - 140, 50))

    # Selection boxes
    x_box = pg.draw.rect(screen, (50, 50, 50), (60, 130, 120, 120))
    o_box = pg.draw.rect(screen, (50, 50, 50), (220, 130, 120, 120))
    
    screen.blit(x_img, (80, 150)) # Bug
    screen.blit(o_img, (240, 150)) # Leaf
    
    label_font = pg.font.Font(None, 25)
    screen.blit(label_font.render("BUG (X)", True, white), (90, 260))
    screen.blit(label_font.render("LEAF (O)", True, white), (250, 260))

    pg.display.update()

    selecting = True
    while selecting:
        for event in pg.event.get():
            if event.type == QUIT:
                pg.quit()
                sys.exit()
            if event.type == MOUSEBUTTONDOWN:
                mx, my = pg.mouse.get_pos()
                # Clicked Bug box
                if 60 <= mx <= 180 and 130 <= my <= 250:
                    XO = 'x'
                    selecting = False
                # Clicked Leaf box
                if 220 <= mx <= 340 and 130 <= my <= 250:
                    XO = 'o'
                    selecting = False

def game_initiating_window():
    screen.blit(game_background, (0, 0)) 
    overlay = pg.Surface((width, 35), pg.SRCALPHA)
    overlay.fill((0, 0, 0, 180)) 
    screen.blit(overlay, (0, 5))

    title_font = pg.font.Font(None, 30) 
    title_text = title_font.render("TIC TAC TOE", True, white)
    title_rect = title_text.get_rect(center=(width // 2, 22))
    screen.blit(title_text, title_rect)

    pg.draw.line(screen, line_color, (width/3,0), (width/3,height), 7)
    pg.draw.line(screen, line_color, (width/3*2,0), (width/3*2,height), 7)
    pg.draw.line(screen, line_color, (0,height/3), (width,height/3), 7)
    pg.draw.line(screen, line_color, (0,height/3*2), (width,height/3*2), 7)
    draw_status()

def draw_status():
    global draw, winner
    if winner is None:
        message = XO.upper() + "'s Turn"
    elif winner == 'draw':
        message = "Game Draw !"
    else:
        message = winner.upper() + " Won !"

    screen.fill((0,0,0), (0,400,width,100))
    font = pg.font.Font(None, 30)
    text = font.render(message, 1, white)
    screen.blit(text, (20, 440))

    # RED EXIT BUTTON
    pg.draw.rect(screen, (200, 0, 0), (260, 430, 110, 40))
    exit_text = pg.font.Font(None, 25).render("EXIT", True, white)
    screen.blit(exit_text, (295, 440))
    pg.display.update()

def check_win():
    global board, winner, draw
    # Rows
    for row in range(3):
        if board[row][0] == board[row][1] == board[row][2] != None:
            winner = board[row][0]
            pg.draw.line(screen, (250,0,0), (0,(row+1)*height/3 - height/6), (width,(row+1)*height/3 - height/6), 4)
            break
    # Cols
    for col in range(3):
        if board[0][col] == board[1][col] == board[2][col] != None:
            winner = board[0][col]
            pg.draw.line(screen, (250,0,0), ((col+1)*width/3 - width/6,0), ((col+1)*width/3 - width/6,height), 4)
            break
    # Diagonals
    if board[0][0] == board[1][1] == board[2][2] != None:
        winner = board[0][0]
        pg.draw.line(screen, (250,70,70), (50,50), (350,350),4)
    if board[0][2] == board[1][1] == board[2][0] != None:
        winner = board[0][2]
        pg.draw.line(screen, (250,70,70), (350,50), (50,350),4)
    
    # Check for Draw
    if all(all(row) for row in board) and winner is None:
        winner = 'draw'

    if winner:
        if winner != 'draw':
            pg.mixer.music.pause()
            win_sound.play()
        draw_status()
        time.sleep(1)
        reset_game_prompt()

def drawXO(row,col):
    global board,XO
    posx = [30, width/3 + 30, width/3*2 + 30][row-1]
    posy = [30, height/3 + 30, height/3*2 + 30][col-1]
    board[row-1][col-1] = XO
    if XO == 'x':
        screen.blit(x_img, (posy,posx))
        XO = 'o'
    else:
        screen.blit(o_img, (posy,posx))
        XO = 'x'
    click_sound.play()   
    pg.display.update()

def user_click():
    x,y = pg.mouse.get_pos()
    
    # EXIT button click during game
    if 260 <= x <= 370 and 430 <= y <= 470:
        pg.quit()
        sys.exit()

    if y < height:
        col = 1 if x<width/3 else 2 if x<width/3*2 else 3
        row = 1 if y<height/3 else 2 if y<height/3*2 else 3
        if board[row-1][col-1] is None:
            drawXO(row,col)
            check_win()

def reset_game_prompt():
    global board, winner, XO, draw
    screen.fill((0,0,0), (0,400,width,100))
    font = pg.font.Font(None, 30)
    
    pg.draw.rect(screen, (0, 150, 0), (40, 430, 140, 40))
    screen.blit(font.render("PLAY AGAIN", True, white), (50, 440))
    
    pg.draw.rect(screen, (200, 0, 0), (220, 430, 110, 40))
    screen.blit(font.render("EXIT", True, white), (250, 440))
    pg.display.update()

    while True:
        for event in pg.event.get():
            if event.type == QUIT:
                pg.quit()
                sys.exit()
            if event.type == MOUSEBUTTONDOWN:
                mx, my = pg.mouse.get_pos()
                if 40 <= mx <= 180 and 430 <= my <= 470:
                    # Reset variables for new round
                    board = [[None]*3,[None]*3,[None]*3]
                    winner = None
                    pg.mixer.music.unpause()
                    choose_character()
                    game_initiating_window()
                    return
                if 220 <= mx <= 330 and 430 <= my <= 470:
                    pg.quit()
                    sys.exit()

# ---------------------- MAIN PROGRAM -------------------
show_welcome()
game_initiating_window()

while True:
    for event in pg.event.get():
        if event.type == QUIT:
            pg.quit()
            sys.exit()
        elif event.type == MOUSEBUTTONDOWN:
            user_click()
    pg.display.update()
    CLOCK.tick(fps)



