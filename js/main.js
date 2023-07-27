
const apiUrl = "https://pokeapi.co/api/v2/pokemon/";
const pageSize = 20; // Número de personajes por página
let currentPage = 1; // Página actual
let totalPages = 0; // Número total de páginas disponibles
let totalPokemonCount = 0; // Número total de personajes disponibles

// Elementos del DOM
const inputSearch = document.querySelector('#inputSearch');
const searchButton = document.querySelector('#searchButton');
const pokemonList = document.querySelector('#pokemonList');
const modal = new bootstrap.Modal(document.getElementById('modal'));
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const btnPrevious = document.getElementById('btnPrevious');
const btnNext = document.getElementById('btnNext');

// Función para inicializar la aplicación al cargar la página
function initializeApp() {
    // Obtener el número total de personajes disponibles en la API
    getTotalPokemonCount().then(count => {
        totalPokemonCount = count;
        // Calcular la cantidad de páginas necesarias para mostrar todos los personajes
        totalPages = Math.ceil(totalPokemonCount / pageSize);
        // Mostrar la primera página de personajes al inicializar la página
        getPokemonList(currentPage);
    });
}

//  obtener el número total de personajes disponibles en la API
function getTotalPokemonCount() {
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo obtener el número total de Pokémon.");
            }
            return response.json();
        })
        .then(data => data.count)
        .catch(err => {
            console.error(err);
            showErrorMessage();
        });
}

// obtener la lista de personajes usando paginación
function getPokemonList(page) {
    const offset = (page - 1) * pageSize;
    fetch(`${apiUrl}?offset=${offset}&limit=${pageSize}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo obtener la lista de Pokémon.");
            }
            return response.json();
        })
        .then(data => {
            // Habilitar o deshabilitar botones de paginación según corresponda
            btnPrevious.disabled = page === 1;
            btnNext.disabled = page === totalPages;

            // Limpiar la lista de tarjetas previas
            pokemonList.innerHTML = "";
            // Mostrar la lista de personajes en la página actual
            data.results.forEach(pokemon => {
                fetch(pokemon.url)
                    .then(response => response.json())
                    .then(pokemonData => {
                        displayPokemonCard(pokemonData);
                    })
                    .catch(err => {
                        console.error(err);
                        showErrorMessage();
                    });
            });
        })
        .catch(err => {
            console.error(err);
            showErrorMessage();
        });
}

// mostrar las tarjetas de Pokémon en la lista
function displayPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.classList.add('col-md-3', 'mb-3');
    card.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="pokemon-image">
                    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="img-fluid">
                </div>
                <h3 class="card-title text-center">${capitalizeFirstLetter(pokemon.name)}</h3>
                <p class="card-text text-center ${getTypeColor(pokemon)}">Tipo: ${capitalizeFirstLetter(pokemon.types[0].type.name)}</p>
                <button class="btn btn-primary btn-block" onclick="showPokemonDetails('${pokemon.name}')">Saber más</button>
            </div>
        </div>
    `;
    pokemonList.appendChild(card);
}
// Función para obtener el color  según el tipo del Pokémon
function getTypeColor(pokemon) {
    const type = pokemon.types[0].type.name;
    return `type-${type}`;
}

// Función para mostrar los detalles del Pokémon en la modal
function displayPokemonDetails(pokemon) {
    modalTitle.textContent = capitalizeFirstLetter(pokemon.name);
    modalContent.innerHTML = `
        <div class="text-center">
            <!--  clase "img-fluid" para que la imagen sea más grande y responsive -->
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="img-fluid" style="max-height: 300px;">
        </div>
        <p class="peso">Peso: ${pokemon.weight} Lbs</p>
        <h3>Habilidades</h3>
        <ul>
        ${pokemon.abilities
            .map(element => `<li>${capitalizeFirstLetter(element.ability.name)}</li>`)
            .join("")
        }
        </ul>
        <h3>Movimientos</h3>
        <ul>
        ${pokemon.moves
            .slice(0, 5)
            .map(element => `<li>${capitalizeFirstLetter(element.move.name)}</li>`)
            .join("")
        }
        </ul>
        <canvas id="pokemonStatsChart" width="400" height="400"></canvas>
    `;

    // Configuración y creación del gráfico de estadísticas
    const arrayStats = pokemon.stats.map(element => element.base_stat);
    const data = {
        labels: [
            'HP',
            'ATTACK',
            'DEFENSE',
            'SPECIAL-ATTACK',
            'SPECIAL-DEFENSE',
            'SPEED',
        ],
        datasets: [{
            label: capitalizeFirstLetter(pokemon.name),
            data: [...arrayStats],
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(255, 99, 132)'
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            elements: {
                line: {
                    borderWidth: 3
                }
            }
        },
    };

    new Chart(document.querySelector('#pokemonStatsChart'), config);
}

//  búsqueda
function handleRequestSearch(event) {
    const pokemonNames = inputSearch.value.trim().toLowerCase().split(',').map(name => name.trim());
    pokemonList.innerHTML = ''; // Limpiar la lista de tarjetas previas

    // Realizar la búsqueda para cada nombre de Pokémon ingresado
    pokemonNames.forEach(pokemonName => {
        // Verificar si el nombre contiene algún número
        const containsNumber = /\d/.test(pokemonName);
        if (containsNumber) {
            showErrorMessage(`El nombre "${pokemonName}" de Pokémon no puede contener números.`);
            return;
        }

        fetch(`${apiUrl}${pokemonName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Pokémon "${pokemonName}" no encontrado`);
                }
                return response.json();
            })
            .then(data => {
                displayPokemonCard(data);
            })
            .catch(err => {
                console.error(err);
                showErrorMessage();
            });
    });
}

// Función para mostrar la modal con los detalles del Pokémon al dar clic en "Saber más"
function showPokemonDetails(pokemonName) {
    fetch(`${apiUrl}${pokemonName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pokémon no encontrado');
            }
            return response.json();
        })
        .then(data => {
            displayPokemonDetails(data);
            showModal(); // Mostrar la modal con los detalles del Pokémon
        })
        .catch(err => {
            console.error(err);
            showErrorMessage();
        });
}

// Función para mostrar la modal
function showModal() {
    modal.show();
}

// Función para ocultar la modal
function hideModal() {
    modal.hide();
}

// Evento clic para el botón "Cerrar" en la modal
modalCloseButton.addEventListener('click', hideModal);

// Función para mostrar un mensaje de error en la lista de Pokémon
const showErrorMessage = (message = "No se encontró información para el Pokémon ingresado. Intente nuevamente.") => {
    pokemonList.innerHTML = `<p>${message}</p>`;
}


//  capitalizar la primera letra de una cadena
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// Evento clic para el botón "Buscar"
searchButton.addEventListener('click', handleRequestSearch);


// Función para obtener el color de fondo según el tipo del Pokémon
function getTypeColor(pokemon) {
    const type = pokemon.types[0].type.name;
    return `type-${type}`;
}

// Función para ir a la página anterior
function goToPreviousPage() {
    currentPage--;
    getPokemonList(currentPage);
}

//  página siguiente
function goToNextPage() {
    currentPage++;
    getPokemonList(currentPage);
}

// botón "Anterior"
btnPrevious.addEventListener('click', goToPreviousPage);

//  botón "Siguiente"
btnNext.addEventListener('click', goToNextPage);

//  botón "Buscar"
searchButton.addEventListener('click', () => {
    // Reiniciar la página a la primera cuando se realiza una nueva búsqueda
    currentPage = 1;
    getPokemonList(currentPage);
});

// Llamada a la función para inicializar la aplicación al cargar la página
initializeApp();