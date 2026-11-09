"use strict";

//======================================
//Simulador Bella Spa
//Pre entrega 6
//Autora: Juanita Callejas Castro
//
//Indice:
// 1. Constantes
// 2. Clase Servicio
// 3. Array de objetos (base de datos del spa) y estado
// 4. Funciones de utilidad (funciones de orden superior)
// 5. Funciones de interfaz (DOM)
// 6. Acciones del usuario (interaccion con prompt)
// 7. Verificacion en consola
// 8. Menu completo (ciclo while + switch)
// 9. Inicio
//======================================

// 1. Constantes

const MIN_SERVICIOS_PAQUETE = 3; //servicios necesarios para el descuento de paquete
const DESCUENTO_PAQUETE = 10; //porcentaje de descuento de paquete
const LIMITE_RESERVA = 5; //servicios maximos por reserva 

// 2. Clase

class Servicio {
    /**
     * @param {number} id - Identificador unico
     * @param {string} nombre - Nombre del servicio
     * @param {string} categoria - Tipo de tratamiento
     * @param {number} precio - Precio en pesos colombianos
     * @param {number} duracionMin - Duracion en minutos
     * @param {number} cupos - Cupos disponibles    
       */

    constructor(id, nombre, categoria, precio, duracionMin, cupos) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = precio;
        this.duracionMin = duracionMin;
        this.cuposTotales = cupos;
        this.cuposDisponibles = cupos;
        this.vecesReservado = 0;
    }

    //Getter: indica si todavia quedan cupos
    get disponible() {
        return this.cuposDisponibles > 0;
    }

    //Metodo de instancia: modifica el estado (reserva un cupo)
    reservar() {
        if (!this.disponible) {
            return false;
        }
        this.cuposDisponibles--;
        this.vecesReservado++;
        return true;
    }

    // Metodo de instancia: modifica el estado (libera un cupo)
    cancelar() {
        if (this.cuposDisponibles >= this.cuposTotales) {
            return false;
        }

        this.cuposDisponibles++;
        return true;
    }
    // Metodo de instancia: calcula un precio con descuento sin modificar el original
    calcularPrecioConDescuento(porcentaje) {
        return Math.round(this.precio *(1 - porcentaje / 100));
    }

    // Metodo de instancia: informa el estado del servicio
    informarEstado() {
        const estado =this.disponible ? "Disponible" : "Sin cupos";
        return `[${this.id}] ${this.nombre} | ${this.categoria} | ${formatearPesos(this.precio)} | ${this.duracionMin} min | Cupos: ${this.cuposDisponibles}/${this.cuposTotales} | ${estado}`;
    }
}

// 3. Array de objetos y estado 

const catalogo =  [
    new Servicio(1, "Masaje relajante", "Masajes", 120000, 60, 4),
    new Servicio(2, "Masaje con piedras calientes", "Masajes", 160000, 75, 2),
    new Servicio(3, "Drenaje linfatico", "Masajes", 140000, 60, 3),
    new Servicio(4, "Limpieza facial profunda", "Faciales", 110000, 50, 5),
    new Servicio(5, "Facial hidratante", "Faciales", 130000, 45, 3),
    new Servicio(6, "Exfoliacion corporal", "Corporales", 125000, 50, 3),
    new Servicio(7, "Envoltura de algas", "Corporales", 150000, 60, 2),
    new Servicio(8, "Circuito de hidroterapia", "Hidroterapia", 95000, 90, 6),
    new Servicio(9, "Ritual de pareja", "Rituales", 380000, 120, 1),
];

const reserva = []; //servicios que la persona va reservando
let vistaActual = catalogo; //lista que se muestra en la pagina
let descripcionVista = "Mostrando todos los servicios";
let porcentajeVista = 0; //descuento simulado de la vista (0 = sin descuento)

// 4. Funciones de utilidad  (funciones de orden superior)

//Formatea un valor como pesos colomianos
const formatearPesos = (valor) => `$${valor.toLocaleString("es-CO")}`;

//Quita tildes y pasa a minusculas para comparar textos
const normalizarTexto = (texto) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// FIND: busca un servicio por ID
const buscarPorId = (lista, id) => lista.find((servicio) => servicio.id === id);

//FILTER: busca servicios cuyo nombre contenga el texto
const buscarPorNombre =(lista,texto) =>
    lista.filter((servicio) => normalizarTexto(servicio.nombre).includes(normalizarTexto(texto)));

//FILTER: servicios de una categoria
const filtrarPorCategoria = (lista, categoria) =>
    lista.filter((servicio) => servicio.categoria === categoria);

//FILTER: servicios con precio menor o igual al maximo
const filtrarPorPrecioMaximo = (lista, maximo) =>
    lista.filter((servicio) => servicio.precio <= maximo);

// SORT + SLICE: los N servicios mas costosos (copia para no alterar el original)
const obtenerMasCostosos = (lista, cantidad) =>
[...lista].sort((a,b) => b.precio - a.precio).slice(0, cantidad);

//MAP: transforma cada servicio en un objeto nuevo con precio promocional
const aplicarDescuentoALista = (lista, porcentaje) =>
    lista.map((servicio) => ({
        id: servicio.id,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        precio: servicio.precio,
        precioFinal: servicio.calcularPrecioConDescuento(porcentaje),
        duracionMin: servicio.duracionMin,
        cuposDisponibles: servicio.cuposDisponibles,
        disponible: servicio.disponible,
    }));

    //MAP + SET: categorias sin repetir 
    const obtenerCategorias = (lista) => [...new Set(lista.map((servicio) => servicio.categoria))];

    // REDUCE: suma de cupos disponibles
    const contarCuposLibres = (lista) =>
        lista.reduce((total, servicio) => total = servicio.cuposDisponibles, 0);

    // SOME: indica si un servicio ya esta en la reserva
    const estaEnReserva = (id) => reserva.some((servicio) => servicio.id === id);

    //REDUCE: calcula subtotal, descuento, total y duracion de la reserva
    function calcularResumen() {
        const subtotal = reserva.reduce((total, servicio) => total + servicio.precio, 0);
        const minutos = reserva.reduce((total, servicio) => total + servicio.duracionMin, 0);
        const aplicaPaquete = reserva.length >= MIN_SERVICIOS_PAQUETE;
        const descuento = aplicaPaquete ? Math.round(subtotal * (DESCUENTO_PAQUETE / 100)) : 0;

        return {
            cantidad: reserva.length,
            minutos,
            subtotal,
            descuento,
            total: subtotal - descuento,
            aplicaPaquete,
        };
    }

    // Construye el texto de un menu numerado con los servicios
    function construirMenuServicios(lista) {
        return lista
        .map((servicio) => {
            const marca = servicio.disponible ? "" : " (sin cupos) ";
            return `${servicio.id}. ${servicio.nombre} - ${formatearPesos(servicio.precio)} ${marca}`;
        })
        .join("/n");
    }

    // 5. Funciones de interfaz (DOM)
    const obtenerElemento = (id) => document.getElementById(id);

    // Muestra un mensaje en la pagina y en la consola
    function notificar(mensaje, esError = false) {
        console.log(mensaje);
        const aviso = obtenerElemento("aviso");
        if  (!aviso) return;
        aviso.textContent = mensaje;
        aviso.classList.toggle("aviso--error", esError);
    }

    //Crea un elemento con texto y clase opcional
    function crearElemento(etiqueta, texto, clase) {
        const elemento = document.createElement(etiqueta);
        if (texto !== undefined) elemento.textContent = texto;
        if (clase) elemento.className = clase;
        return elemento;
     }

     // Pinta las tarjetas de la lista que se este mostrando
     function renderizarServicios() {
        const contenedor = obtenerElemento("tarjetas");
        const descripcion = obtenerElemento("vista-descripcion");
        if (!contenedor) return;

        if (descripcion) descripcion.textontent = descripcionVista;
        contenedor.innerHTML = "";

        if (vistaActual.length === 0) {
            contenedor.appendChild(crearElemento("p", "No hay servicios que coincidan con tu busqueda.", "vacio"));
            return;
        }

        vistaActual.forEach((servicio) => {
            const tarjeta = crearElemento("article", undefined, `tarjeta${servicio.disponible ? "" : "tarjeta--agotado"}`);

            tarjeta.appendChild(crearElemento("span", servicio.categoria, "tarjeta__categoria"));
            tarjeta.appendChild(crearElemento("h3", servicio.nombre));
            tarjeta.appendChild(
                crearElemento("p", `ID ${servicio.id} | ${servicio.duracionMin} min | Cupos: ${servicio.cuposDisponibles}`, "tarjeta__meta")
            );

            const precio = crearElemento("p", undefined, "tarjeta__precio");
            if (servicio.precioFinal !== undefined) {
                precio.appendChild(crearElemento("s", formatearPesos(servicio.precio)));
                precio.appendChild(document.createTextNode(formatearPesos(servicio.precioFinal)));
            } else {
                precio.textContent = formatearPesos(servicio.precio);
            }
            tarjeta.appendChild(precio);

            const boton = crearElemento("button", servicio.disponible ? "Reservar" : "Sin cupos", "boton");
            boton.type = "button";
            boton.dataset.reservar = servicio.id;
            boton.disabled = !servicio.disponible || estaEnReserva(servicio.id);
            if (estaEnReserva(servicio.id)) boton.textContent = "En tu reserva";
            tarjeta.appendChild(boton);

            contenedor.appendChild(tarjeta);
        });
     }

     //Pinta las tarjetas de la lista que se este mostrando
     function renderizarReserva() {
        const lista = obtenerElemento("lista-reserva");
        if (lista) {
            lista.innerHTML = "";

            if (reserva.length === 0) {
                lista.appendChild(crearElemento("li", "Aun no has reservado ningun servicio."));
            }

            reserva.forEach((servicio) => {
                const item = document.createElement("li");
                const texto = document.createElement("span");
                texto.appendChild(document.createTextNode(servicio.nombre));
                texto.appendChild(crearElemento("small", `${servicio.duracionMin} min | ${formatearPesos(servicio.precio)}`));

                const boton = crearElemento("button", "Quitar", "boton");
                boton.type = "button";
                boton.dataset.cancelar = servicio.id;

                item.appendChild(texto);
                item.appendChild(boton);
                lista.appendChild(item);

            });                                                                                                                     
        }

        const resumen =calcularResumen();
        const campos = {
            "res-cantidad": resumen.cntidad,
            "res-duracion": `${resumen.minutos} min`,
            "res-subtotal": formatearPesos(resumen.subtotal),
            "res-descuento": resumen.descuento > 0 ? `-${formatearPesos(resumen.descuento)}` : "$0",
            "res-total": formatearPesos(resumen.total),
        };
        Object.entries(campos).forEach(([id, valor]) => {
            const elemento = obtenerElemento(id);
            if (elemento) elemento.textContent = valor;
        });
     }

     //Actualiza los tres datos de la portada
     function renderizarProtada() {
        const servicios = obtenerElemento("dato-servicios");
        const cupos = obtenerElemento("dato-cupos");
        const categorias = obtenerElemento("dato-categorias");

        if (servicios) servicios.textContent = catalogo.length;
        if (cupos) cupos.textContent = contarCuposLibres(catalogo);
        if (categorias) categorias.textContent = obtenerCategorias(catalogo).length;
     }

     //Refresca toda la interfaz
     function actualizarInterfaz() {
        //La vista con descuento se recalcula para reflejar los cupos actuales
        if (porcentajeVista > 0) {
            vistaActual = aplicarDescuentoALista(catalogo, porcentajeVista);
        }

        renderizarProtada();
        renderizarServicios();
        renderizarReserva();
     }

     //Cambia la lista que se muestra y la describe
     function mostrarVista(lista, descripcion, porcentaje = 0) {
        vistaActual = lista;
        descripcionVista = porcentaje;
        actualizarInterfaz();

        const catalogoSeccion = obtenerElemento("catalogo");
        if (catalogoSeccion) catalogoSeccion.scrollIntoView({ behavior: "smooth", block: "start" });
     }

     // 6. Acciones del usuario (interaccion con prompt)

     // Muestra todo el catalogo
     function accionVerTodos() {
        mostrarVista(catalogo, "Mostrando todos los servicios");
        console.log("Catalogo completo");
        catalogo.forEach((servicio) => console.log(servicio.informarEstado()));
     }

     // FIND + FILTER: busca por ID o por nombre
     function accionBuscar() {
        const entrada = prompt("Escribe el ID o parte del nombre del servicio:");
        if(entrada === null || entrada.trim() === "") return;

        const texto = entrada.trim();

        if (!isNaN(Number(texto))) {
            const encontrado = buscarPorId(catalogo, Number(texto));

            if (!encontrado) {
                notificar(`No existe un servicio con el ID ${texto}.`, true);
                alert(`No existe un servicio con el ID ${texto}.`);
                return;
            }

            mostrarVista([encontrado], `Resultado de buscar el ID ${texto}`);
            notificar(`Encontrado: ${encontrado.informarEstado()}`);
            return;
        }

        const resultados = buscarPorNombre(catalogo, texto);
        mostrarVista(resultados, `Resultados para "${texto}" (${resultados.length})`);
        notificar(`Busqueda "${texto}" : ${resultados.length}  resultado(s).`, resultados.length === 0);
        resultados.forEach((servicio) => console.log(servicio.informarEstado()));
     }

     // FILTER: por categoria
     function accionFiltrarCategoria() {
        const categorias = obtenerCategorias(catalogo);
        const menu = categorias.map((categoria, indice) => `${indice + 1}. ${categoria}`).join("\n");

        const entrada = prompt(`Elige el numero de la categoria:\n\n${menu}`);
        if (entrada === null) return;

        const categoria = categorias[Number(entrada) - 1];

        if (!categoria) {
            notificar("Categoria no valida. Elige un numero del menu.", true);
            alert(" Categoria no valida.");
            return;
        }

        const resultados = filtrarPorCategoria(catalogo, categoria);
        mostrarVista(resultados, `Categoria ${categoria} (${resultados.length} servicios)`);
        notificar(`Filtro por categorias: ${categoria}. `);
        resultados.forEach((servicio) => console.log(servicio.informarEstado()));
     }

     // FILTER: por precio maximo
     function accionFiltrarPrecio() {
        const entrada = prompt("¿Cuál es tu presupuesto máximo por servicio? (en pesos, ej: 130000)");
  if (entrada === null) return;

  const maximo = Number(entrada);

  if (isNaN(maximo) || maximo <= 0) {
    notificar("Escribe un valor numerico mayor a 0.", true);
    alert("Escribe un valor numerico mayor a 0.");
    return;
  }

  const resultados = filtrarPorPrecioMaximo(catalogo, maximo);
  mostrarVista(resultados, `Servicios hasta ${formatearPesos(maximo)} (${resultados.length})`);
  notificar(`Filtro por precio: ${resultados.length} servicio(s) hasta ${formatearPesos(maximo)}`, resultados.length === 0);
  resultados.forEach((servicio) => console.log(servicio.informarEstado()));
}

//SORT + SLICE: los 3 mas costosos
function accionTopCostosos() {
    const top = obtenerMasCostosos(catalogo, 3);
    mostrarVista(top, "Los 3 servicios mas costosos");
    notificar("Mostrando los 3 servicios mas costosos");
    top.forEach((servicio, indice) => console.log(`${indice + 1}. ${servicio.nombre} - ${formatearPesos(servicio.precio)}`));
}

//MAP: descuento simulado

function accionAplicarDescuento() {
    const entrada = prompt("¿Qué porcentaje de descuento quieres simular? (1 a 90)");
  if (entrada === null) return;


const porcentaje = Number(entrada);

if (!Number.isInteger(porcentaje) || porcentaje < 1  || porcentaje > 90) {
     notificar("Escribe un porcentaje entero entre 1 y 90.", true);
     alert("❌ Escribe un porcentaje entero entre 1 y 90.");
     return;
     }
 
  const conDescuento = aplicarDescuentoALista(catalogo, porcentaje);
  mostrarVista(conDescuento, `Precios con ${porcentaje}% de descuento (simulación)`, porcentaje);
  notificar(`Simulación de ${porcentaje}% de descuento. Los precios originales no cambian.`);
  console.table(conDescuento.map(({ nombre, precio, precioFinal }) => ({ nombre, precio, precioFinal })));

    }

//Reserva  un servicio por su ID (la usan el prompt  y los botones de las tarjetas)
function reservarServicio(id) {
    const servicio = buscarPorId(catalogo, id);

    if (!servicio) {
        notificar("ID no valido. Escribe uno de los numeros del menu", true);
        alert(" ID no valido. ");
        return;
    }

    if (estaEnReserva(id)) {
          notificar(`Ya tienes "${servicio.nombre}" en tu reserva.`, true);
        alert(` Ya tienes "${servicio.nombre}" en tu reserva.`);
        return;
    }

        if (reserva.legth >= LIMITE_RESERVA) {
        notificar (`Tu reserva ya tiene ${LIMITE_RESERVA} servicios. Quita uno para agregar otro.`, true);
        alert(`El maximo por reserva es de  ${LIMITE_RESERVA} servicios.`);
        return;
    }

    if (!servicio.reservar()) {
        notificar(`"${servicio.nombre}" no tiene cupos disponibles.`, true);
        alert(`⚠️ "${servicio.nombre}" no tiene cupos disponibles.`);
        return;
    }

    reserva.push(servicio);
    notificar(`Reservast "${servicio.nombre}". Quedan ${servicio.cuposDisponibles} cupos.`);
    actualizarInterfaz();
}

// FIND: reserva pidiendo el ID por prompt
function accionReservar() {
    const entrada = prompt(`¿Qué servicio quieres reservar? Escribe el ID:\n\n${construirMenuServicios(catalogo)}`);
    if (entrada === null || entrada.trim() ==="") return;

    reservarServicio(Number(entrada));
}

// FINDIMEX: cancela un servicio de la reserva
function cancelarServicio(id) {
    const posicion = reserva.findIndex((servicio) => servicio.id === id);

    if (posicion === -1) {
        notoficar("ese servicio no esta en tu reserva.", true);
        alert("Ese servicio no esta en tu reserva.");
        return;
    }

    const [servicio] = reserva.splice(posicion, 1);
    servicio.cancelar();
    notificar(`Quitaste "${servicio.nombre}" de tu reserva.`);
    actualizarInterfaz();
}

function accionCancelar() {
    if (reserva.length === 0) {
        notificar("Tu reserva esta vacia.", true);
        alert("No tienes servicios en tu reserva.");
        return;
    }

    const entrada = prompt(`¿Qué servicio quitas? Escribe el ID:\n\n${construirMenuServicios(reserva)}`);
    
    if (entrada === null || entrada.trim() === "") return;

    cancelarServicio(Number(entrada));
}
    // REDUCE: resumen de la reserva

    function accionResumen() {
    if (reserva.length === 0) {
    notificar("Tu reserva esta vacia. Reserva un servicio para ver el resumen.", true);
        alert("Aun no has reservado ningun servicio.");
        return;
}

const resumen = calcularResumen();

let mensaje = "RESUMEN DE TU RESERVA\n\n";
mensaje += reserva.map ((servicio)=> `- ${servicio.nombre} (${formatearPesos(servicio.precio)})`).join("\n");
  mensaje += `\n\nDuración total: ${resumen.minutos} min`;
  mensaje += `\nSubtotal: ${formatearPesos(resumen.subtotal)}`;
  mensaje += resumen.aplicaPaquete
    ? `\nDescuento de paquete (${DESCUENTO_PAQUETE}%): -${formatearPesos(resumen.descuento)}`
    : `\nReserva ${MIN_SERVICIOS_PAQUETE} servicios o más para un ${DESCUENTO_PAQUETE}% de descuento.`;
  mensaje += `\nTOTAL: ${formatearPesos(resumen.total)}`;
 
  console.log(mensaje);
  alert(mensaje);
  notificar(`Resumen: ${resumen.cantidad} servicio(s), total ${formatearPesos(resumen.total)}.`);
    }

    // 7. Verificacion en consola
    // Usa objetos de prueba para no alterar el catalogo real.

    function verificarMetodos() {
        console.group("Verificacion de funciones de orden superior");

        console.log("find (ID 4):", buscarPorId(catalogo, 4) .nombre);
        console.log("filter (Masajes:", filtrarPorCategoria(catalogo, "Masajes").map((s) => s.nombre));
        console.log("filter (hasta $130.000):", filtrarPorPrecioMaximo(catalogo, 130000).map((s) => s.nombre));
        console.log("map (20% de descuento, primeros 3):", aplicarDescuentoALista(catalogo, 20).slice( 0, 3).map((s) => `${s.nombre}: ${s.precioFinal}`));
        console.log("reduce (cupos libres):", contarCuposLibres(catalogo));
        console.log("sort (3 mas costosas):", obtenerMasCostosos(catalogo,3 ).map((s) => s.nombre));

        const servicioPrueba = new Servicio(99, "Servicio de prueba", "Pruebas", 1000000, 30, 1);
        console.log("Metodo reservar():", servicioPrueba.reservar(), "| cupos:", servicioPrueba.cuposDisponibles);

        console.groupEnd();
    }

    // 8. Menu completo (ciclo while = switch)
    
    function iniciarMenu() {
        let opcion = "";

        while (opcion !== "0") {
            opcion = prompt(
                "MENU BELLA SPA\n\n" +
                "1. Ver todos los servicios\n" +
                "2. Buscar servicio (ID o nombre)\n" +
                "3. Filrar por categoria\n" +
                "4. Filtrar por precio maximo\n" +
                "5. Los 3 mas costosos \n" +
                "6. Aplicar descuento (simulacion)\n" +
                "7. Reservar un servicio\n" +
                "8. Cancelar un servicio\n" +
                "9. Ver resumen de la reserva\n" +
                "0. Salir"
            );

            if (opcion === null) break;

            switch (opcion.trim()) {
                case "1": accionVerTodos(); break;
                case "2": accionBuscar(); break;
                case "3": accionFiltrarCategoria(); break;
                case "4": accionFiltrarPrecio(); break;
                case "5": accionTopCostosos(); break;
                case "6": accionAplicarDescuento(); break;
                case "7": accionReservar(); break; 
                case "8": accionCancelar(); break;
                case "9": accionResumen(); break;
                case "0": alert("¡Gracias por visitar Lumen Spa! 🪷"); break;
                default: alert("Opción no válida. Elige un número entre 0 y 9.");
            }
        }

        console.log("FIN DEL MENU");
        console.log(`Servicios reservados: ${reserva.length} | Total: ${formatearPesos(calcularResumen().total)}`);
    }

    // 9. Inicio
    //La pagina carga primero y las acciones arrancan con los botones.

    document.addEventListener("DOMContentLoaded" , () =>{
        actualizarInterfaz();
        verificarMetodos();

        const acciones = {
            menu: iniciarMenu,
            buscar: accionBuscar,
            categoria: accionFiltrarCategoria,
            precio: accionFiltrarPrecio,
            top: accionTopCostosos,
            descuento: accionAplicarDescuento,
            reservar: accionReservar,
            cancelar: accionCancelar,
            resumen: accionResumen,
            todos: accionVerTodos,
        };

        document.querySelectorAll("[data-accion").forEach((boton) => {
            boton.addEventListener("click", acciones[boton.dataset.accion]);
        });

        //Delegacion de eventos: botones Reservas y Quitar creados dinamicamente
        document.addEventListener("click", (evento) => {
            const botonReservar = evento.target.closest("[data-reservar]");
            const botonCancelar = evento.target.closest("[data-cancelar]");

            if (botonReservar) reservarServicio(Number(botonReservar.dataset.reservar));
            if (botonCancelar) cancelarServicio(Number(botonCancelar.dataset.cancelar));
        });
    });
