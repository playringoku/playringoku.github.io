# Ringoku

Un pasatiempo de lógica circular con un puzzle nuevo cada día. Disponible en español e inglés: el idioma se elige según el navegador y se puede cambiar con el botón ES / EN.

## Reglas

1. Cada anillo lleva los números del 1 al 8, sin repetir.
2. Dos trozos que se tocan nunca llevan números consecutivos (un 4 no puede tocar ni un 3 ni un 5).

Cada trozo toca 6: 2 a sus lados, 2 en el anillo de fuera y 2 en el de dentro (los anillos están desplazados medio trozo, como ladrillos).

**Vidas y pistas:** hay 3 vidas; cada número equivocado resta una y a la tercera se pierde el puzzle del día (se muestra la solución y la racha vuelve a cero). Las notas no cuentan. Hay 3 pistas por puzzle: cada una revela el siguiente trozo que se puede deducir con lo que hay en el tablero (`AN.hint` en `src/anillos-core.js`). El resultado para compartir indica vidas y pistas usadas, y un puzzle sin fallos ni pistas cuenta como perfecto.

## Cómo funciona el puzzle diario

- La página genera el puzzle a partir de la fecha. La misma fecha produce siempre el mismo puzzle, así que todo el mundo juega el mismo ese día. No hay servidor.
- La dificultad depende del día de la semana: lunes y martes fácil, miércoles y jueves medio, viernes y sábado difícil, domingo muy difícil.
- Todos los puzzles tienen una única solución y se resuelven razonando.
- El progreso, la racha y los tiempos se guardan en el navegador de cada jugador (`localStorage`). Van ligados al dominio: si la web cambia de dominio, se pierden.
- El puzzle nº 1 corresponde al 12 de octubre de 2026.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | La página jugable. Es la que publica GitHub Pages. Se genera con `build.js`; no se edita a mano. |
| `src/anillos-core.js` | Generador y resolvedor de puzzles. |
| `src/index.template.html` | Diseño e interfaz de la página. |
| `build.js` | Une la plantilla y el generador en `index.html`. |
| `test/anillos-core-test.js` | Comprueba 28 días seguidos: que el resultado es determinista, que las soluciones cumplen las reglas y que son únicas. |

## Desarrollo

```bash
node test/anillos-core-test.js   # comprobar el generador
node build.js                    # regenerar index.html tras cualquier cambio
```

Cambiar el generador (`src/anillos-core.js`) cambia los puzzles de todos los días, incluidos los ya jugados. Si se modifica después de publicar, conviene hacerlo de forma que los días pasados sigan generando el mismo puzzle.

## Publicar

La web se publica automáticamente con GitHub Pages desde la rama `main` (carpeta raíz) en **https://playringoku.github.io**. Si algún día deja de publicarse, revisa **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
