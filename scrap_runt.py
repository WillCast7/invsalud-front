import time
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import psycopg2

# Configurar Selenium
driver = webdriver.Chrome()

# Función para resolver CAPTCHA manualmente
def resolver_captcha():
    input("Presiona Enter después de resolver el CAPTCHA manualmente: ")

# Conectar a la base de datos PostgreSQL
conn = psycopg2.connect(
    dbname="tu_base_de_datos",
    user="tu_usuario",
    password="tu_contraseña",
    host="tu_host",
    port="tu_puerto"
)
cur = conn.cursor()

# Crear la tabla si no existe
cur.execute('''
    CREATE TABLE IF NOT EXISTS datos_runt (
        cedula TEXT PRIMARY KEY,
        placa TEXT,
        marca TEXT,
        modelo TEXT,
        año INTEGER,
        color TEXT
    )
''')
conn.commit()

# Leer las cédulas desde un archivo Excel
df = pd.read_excel('ruta_al_archivo_excel.xlsx')  # Reemplaza con la ruta a tu archivo Excel
cedulas = df['cedula'].tolist()  # Asegúrate de que la columna se llame 'cedula'

for cedula in cedulas:
    # Abrir la página del RUNT
    driver.get('https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo')

    # Esperar a que la página se cargue
    time.sleep(2)

    # Encontrar el campo de entrada de la cédula y enviar la cédula
    input_cedula = driver.find_element(By.NAME, 'cedula')  # Ajusta el selector según la página
    input_cedula.send_keys(cedula)
    input_cedula.send_keys(Keys.RETURN)

    # Esperar a que aparezca el CAPTCHA y resolverlo manualmente
    resolver_captcha()

    # Esperar a que los resultados se carguen
    time.sleep(5)

    # Obtener el HTML de la página después de la consulta
    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')

    # Extraer la información deseada
    placa = soup.select_one('.clase-de-la-placa').text if soup.select_one('.clase-de-la-placa') else 'N/A'
    marca = soup.select_one('.clase-de-la-marca').text if soup.select_one('.clase-de-la-marca') else 'N/A'
    modelo = soup.select_one('.clase-del-modelo').text if soup.select_one('.clase-del-modelo') else 'N/A'
    año = soup.select_one('.clase-del-año').text if soup.select_one('.clase-del-año') else 'N/A'
    color = soup.select_one('.clase-del-color').text if soup.select_one('.clase-del-color') else 'N/A'

    # Insertar los datos en la base de datos
    cur.execute('''
        INSERT INTO datos_runt (cedula, placa, marca, modelo, año, color)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (cedula) DO NOTHING
    ''', (cedula, placa, marca, modelo, año, color))
    conn.commit()

# Cerrar la conexión a la base de datos
cur.close()
conn.close()

# Cerrar el navegador
driver.quit()