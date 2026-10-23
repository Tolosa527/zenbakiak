# Especificación frontend: estilo, componentes y animaciones

## 1. Propósito y límites

Este documento traduce patrones observados en la web pública de Duolingo en una
guía implementable para una web app educativa con formato de juego. Es una
referencia de diseño e interacción, no una instrucción para copiar marca,
ilustraciones, personajes, textos o assets propietarios.

La captura se realizó sobre `https://www.duolingo.com/` en Chromium 156,
viewport de 1280x900, idioma `en-US`, tema claro y `reduced_motion=no-preference`.
Las observaciones principales están respaldadas por:

- `ev_196c0972acbf2e90e0fd6692722b78980f62c212357a7f51765846e887189802`:
  portada, DOM/accesibilidad, recursos y red durante carga.
- `ev_08c9910a317f7877752691fc1960ca39603bc07d236681d274a79ecb81e61d5a`:
  inventario pasivo de scripts, CSS, fuentes e imágenes.
- `ev_fb81f86990f40051d8cc07b416892cb531f9ec669476c71d358a778280321a70`:
  rechazo de cookies y estado del selector de idioma.
- `ev_631140ab7dde7683d752ef398a5157a0400251f29ffb91400dad9f9a56f486a3`:
  estados temporales de la animación del hero.

## 2. Superficies observadas

| Ruta | Composición observada | Tratamiento visual |
|---|---|---|
| `/` | Hero de adquisición, selector de idioma, navegación de productos, bloques de beneficios, suscripción, footer y consentimiento | Fondo blanco, verde de marca, CTA verde, CTA secundario blanco con borde y sombra inferior |
| `/register` | Selección inicial de objetivo mediante tarjetas de idioma/producto | Grid de tarjetas blancas, borde gris, iconografía grande y métrica secundaria |
| `/courses` | Catálogo de cursos para hablantes de inglés | Barra superior azul, logo blanco, botones `LOGIN`/`GET STARTED`, grid de tarjetas y selector de idioma de interfaz |
| `/super` | Landing de suscripción con hero, pricing y explicación del trial | Fondo azul marino, tipografía blanca, haces de luz diagonales, ilustración con gradiente y carrusel inferior |
| `/chess` | Landing específica de producto | Hero verde menta, tablero como suelo, piezas/mascota en ilustración y CTA verde |
| `/math` | Landing específica de producto | Fondo blanco, hero con personajes y formas matemáticas azules, CTA azul |

Las rutas `/chess` y `/math` dirigen a `/register/CHESS_CH` y
`/register/MATH_BT`, respectivamente, cuando el usuario pulsa el CTA principal.
El catálogo dirige a cursos como `/course/es/en/Learn-Spanish` y a productos
como `/chess` o `/course/math/Learn-Math`.

## 3. Sistema visual recomendado

Los valores siguientes son tokens de implementación inspirados en lo observado;
los colores exactos deben validarse contra el branding propio del producto.

```css
:root {
  --color-primary: #58cc02;       /* acción positiva / progreso */
  --color-primary-dark: #46a302;  /* sombra o estado pressed */
  --color-info: #1cb0f6;          /* acción secundaria / enlace */
  --color-success: #00b894;       /* producto alternativo */
  --color-surface: #ffffff;
  --color-background-soft: #eefbf8;
  --color-background-dark: #080a3a;
  --color-text: #4b4b4b;
  --color-text-muted: #777777;
  --color-border: #e5e5e5;
  --radius-card: 16px;
  --radius-button: 12px;
  --shadow-lip: 0 4px 0 rgba(0, 0, 0, .16);
  --content-width: 1064px;
}
```

### Tipografía

- Usar una sans redondeada y de alta legibilidad para títulos, números y CTA.
- El CSS observado declara familias como `DIN Next for Duolingo` y
  `duolingo-sans`; para el producto propio se debe sustituir por una fuente con
  licencia compatible.
- Títulos: peso 700/800, interlineado compacto, frases cortas.
- CTA y navegación: mayúsculas, peso 700, tracking ligeramente aumentado.
- Texto auxiliar: color gris medio y contraste suficiente sobre blanco.

### Botones

- Altura mínima recomendada: `48px`; ancho del CTA del hero: `320–360px`.
- Radio de `12–16px`.
- Botón primario: color sólido, texto blanco y sombra inferior de 3–5px.
- Botón secundario: fondo blanco, borde de 2px y sombra inferior gris.
- Hover: aumentar brillo aproximadamente `1.1`.
- Pressed: eliminar o reducir la sombra y desplazar el botón 2–4px hacia abajo.
- Focus: anillo visible independiente del color del botón.
- Deshabilitado: reducir contraste y opacidad, sin eliminar el estado de foco.

El bundle CSS observado usa transiciones cortas de `filter` (aprox. `0.2s`),
color (`0.3s`) y transformaciones con una curva de salida rápida
`cubic-bezier(.22, 1, .36, 1)`.

## 4. Componentes y comportamiento

### 4.1 Shell global

1. **Header**
   - Logo a la izquierda.
   - Selector de idioma en desktop a la derecha.
   - En `/courses`, añade navegación de autenticación (`LOGIN` y `GET STARTED`)
     sobre una franja azul.
   - Mantener el header fuera del flujo del hero solo si el diseño necesita
     una composición a pantalla completa.

2. **Selector de producto**
   - En la portada se presenta como navegación horizontal con icono, nombre y
     flechas laterales.
   - Debe ser desplazable horizontalmente en móvil.
   - Cada elemento debe ser un enlace accesible, no solo un listener sobre un
     `div`.

3. **Banner de consentimiento**
   - Se observa como panel inferior fijo con separador superior.
   - Contiene título, explicación, enlace de política y dos acciones.
   - `ACCEPT COOKIES` y `REJECT ALL` eliminan el banner y liberan la parte
     inferior de la página.
   - Persistir la decisión por origen; no bloquear el contenido principal
     mientras se carga el proveedor de consentimiento.

### 4.2 Hero

- Layout de dos columnas en desktop: ilustración a la izquierda y copy/CTA a
  la derecha; invertir o apilar en móvil.
- Una sola acción primaria y una secundaria.
- Reservar tamaño para la ilustración para evitar layout shift.
- La portada muestra una animación de composición: al inicio aparece un estado
  parcial y, tras la carga, se completa la ilustración y aparece el copy/CTA.
- Cargar la animación de forma diferida; el contenido textual debe ser
  utilizable aunque falle el asset animado.

### 4.3 Tarjetas de selección y catálogo

- Tarjeta blanca, borde gris claro de 2px, radio aproximado de `16px`.
- Icono centrado, título en peso fuerte y métrica en color secundario.
- Toda la tarjeta es clicable.
- En hover se puede elevar 2–4px y reforzar la sombra; no cambiar el layout.
- Usar CSS Grid:

```css
.course-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

@media (max-width: 900px) {
  .course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

### 4.4 Landing premium

- Usar un tema aislado de variables para no contaminar el shell estándar.
- Fondo oscuro con gradientes diagonales de baja opacidad.
- Ilustración principal con foco de luz y acentos de color.
- Carrusel de idiomas/productos fijo al pie del hero; debe exponer controles
  de teclado y posición actual.
- La información de precios debe ser semántica (`<table>` o grupos etiquetados)
  y no depender solo de color.

## 5. Animación y motion system

### 5.1 Animación de entrada del hero

La captura temporal `ev_631140ab...` muestra que, aproximadamente un segundo
después de iniciar la página, el hero puede estar en un estado parcial, y que
unos segundos después aparece la composición completa. La red observada incluye
assets SVG bajo `images/splash/lottie/` y varios JSON bajo `lottie/splash/`.
Esto respalda el uso de una animación declarativa tipo Lottie o SVG, pero no
prueba la implementación interna exacta de cada escena.

Recomendación:

- `opacity` + `transform: translateY/scale` para copy y CTA.
- Ilustración en una capa independiente.
- Duración de entrada: `400–700ms`; stagger entre ilustración, título y CTA:
  `80–140ms`.
- No animar `top`, `left`, `width` o `height`; preferir `transform` y `opacity`.

```css
@keyframes hero-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-copy {
  animation: hero-enter 500ms cubic-bezier(.22, 1, .36, 1) both;
}
```

### 5.2 Estados interactivos

- Hover: `filter: brightness(1.1)` o elevación mínima.
- Pressed: `transform: translateY(2px)` y menor sombra.
- Menús: entrada por `opacity` y `translateY(8–20px)`.
- Carruseles: `transform` con easing de salida; no saltar entre anchos.
- Carga: skeleton o placeholder estable; evitar spinner como única señal.

### 5.3 Accesibilidad de movimiento

El CSS observado contiene reglas `html[reduced-motion]` que eliminan
animaciones y transiciones concretas. El producto propio debe respetar
`prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

La reducción no debe ocultar información: mostrar una ilustración estática
equivalente y mantener estados de éxito/error mediante color, texto o iconos.

## 6. Responsive y accesibilidad

- Breakpoints mínimos: móvil `0–599px`, tablet `600–1023px`, desktop
  `1024px+`; validarlos con contenido real.
- En móvil, hero apilado, botones a ancho completo y grids de dos columnas o
  una columna según la tarjeta.
- Todo control debe tener nombre accesible y estado (`expanded`, `pressed`,
  `selected`, `disabled`) cuando corresponda.
- Mantener foco visible y orden de tabulación lógico.
- No usar solo banderas o color para identificar un curso.
- Las ilustraciones decorativas deben tener `alt=""`; las que comunican
  significado deben tener texto alternativo.

## 7. Criterios de aceptación frontend

- El hero mantiene su composición sin layout shift cuando la animación falla.
- Los CTA tienen estados hover, focus, pressed y disabled verificables.
- El banner de consentimiento no cubre controles críticos en móvil.
- `/register` y `/courses` conservan una grid usable con teclado y lector de
  pantalla.
- La app ofrece una variante estática cuando `prefers-reduced-motion` está
  activo.
- Las animaciones principales mantienen 60 fps en un dispositivo objetivo
  definido por el equipo.

