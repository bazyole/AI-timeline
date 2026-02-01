// Gestion des contrôles et interactions utilisateur

// Gestionnaires des filtres de compagnies
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        updateChart();
    });
});

// Gestionnaires des boutons d'application d'axes
document.getElementById('applyX').addEventListener('click', () => applyAxisScale('x'));
document.getElementById('applyY').addEventListener('click', () => applyAxisScale('y'));

// Gestionnaires des boutons de zoom
document.getElementById('zoomIn').addEventListener('click', () => chart.zoom(1.2));
document.getElementById('zoomOut').addEventListener('click', () => chart.zoom(0.8));
document.getElementById('resetZoom').addEventListener('click', () => {
    chart.resetZoom();
    resetAxes();
    chart.update('none');
});

// Gestionnaires des boutons de plage de dates
document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', () => applyDateRange(btn.dataset.range));
});

// Désactiver le menu contextuel sur le canvas
document.getElementById('mainChart').addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Gestionnaire de navigation par les touches fléchées
window.addEventListener('keydown', handleArrowPan);

// Initialiser le graphique au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    initChart();
});
