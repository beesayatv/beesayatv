(function () {
    'use strict';

    var panel = document.getElementById('atlas-offline-panel');
    if (!panel) {
        return;
    }

    var status = document.getElementById('atlas-offline-status');
    var actions = document.getElementById('atlas-offline-actions');
    var primary = document.getElementById('atlas-offline-primary');
    var secondary = document.getElementById('atlas-offline-secondary');
    var menu = document.getElementById('atlas-offline-menu');
    var progress = document.getElementById('atlas-offline-progress');
    var progressBar = document.getElementById('atlas-offline-progress-bar');
    var config = window.beesayatvAtlasOfflineConfig || {};
    var registration;
    var statusTimeout;

    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        panel.dataset.state = 'local-preview';
        setStatus('Offline download activates on the secure published site.');
        actions.hidden = false;
        primary.textContent = 'Download Cebu map';
        primary.disabled = true;
        secondary.hidden = true;
        return;
    }

    function setStatus(message) {
        status.textContent = message;
    }

    function showInitialChoice() {
        panel.dataset.state = 'choice';
        setStatus('Save Cebu for hikes with no signal.');
        primary.textContent = 'Download Cebu map';
        secondary.hidden = false;
        secondary.textContent = 'Stay online';
        actions.hidden = false;
        menu.hidden = true;
        progress.hidden = true;
    }

    function showReady() {
        panel.dataset.state = 'ready';
        setStatus('Cebu offline map ready');
        primary.textContent = 'Offline map ready';
        secondary.hidden = true;
        actions.hidden = false;
        menu.hidden = false;
        progress.hidden = true;
    }

    function showOnlineOnly() {
        panel.dataset.state = 'online';
        setStatus('Using the online map');
        primary.textContent = 'Download Cebu map';
        secondary.hidden = true;
        actions.hidden = false;
        menu.hidden = true;
        progress.hidden = true;
    }

    function showProgress(message, ratio) {
        panel.dataset.state = 'downloading';
        setStatus(message);
        actions.hidden = true;
        menu.hidden = true;
        progress.hidden = false;
        progressBar.style.width = Math.max(3, Math.min(100, ratio || 3)) + '%';
    }

    function workerMessage(message) {
        var worker = registration && (registration.active || registration.waiting || registration.installing);
        if (worker) {
            worker.postMessage(message);
        }
    }

    function atlasResources() {
        var resources = [window.location.href, config.packageUrl];
        document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(function (element) {
            resources.push(element.src || element.href);
        });
        (config.trails || []).forEach(function (trail) {
            if (trail.show_in_atlas === '1' && trail.geojson) {
                resources.push(trail.geojson);
            }
        });
        return Array.from(new Set(resources.filter(Boolean)));
    }

    function checkSavedMap() {
        workerMessage({ type: 'ATLAS_OFFLINE_STATUS' });
        window.clearTimeout(statusTimeout);
        statusTimeout = window.setTimeout(function () {
            showInitialChoice();
        }, 2500);
    }

    function startDownload() {
        showProgress('Preparing Cebu map…', 3);
        workerMessage({ type: 'DOWNLOAD_CEBU_MAP', resources: atlasResources() });
    }

    primary.addEventListener('click', function () {
        if (panel.dataset.state === 'ready') {
            menu.hidden = !menu.hidden;
            return;
        }
        startDownload();
    });

    secondary.addEventListener('click', showOnlineOnly);

    document.getElementById('atlas-offline-update').addEventListener('click', function () {
        menu.hidden = true;
        startDownload();
    });

    document.getElementById('atlas-offline-remove').addEventListener('click', function () {
        workerMessage({ type: 'REMOVE_CEBU_MAP' });
    });

    navigator.serviceWorker.addEventListener('message', function (event) {
        var message = event.data || {};

        if (message.type === 'ATLAS_OFFLINE_STATUS') {
            window.clearTimeout(statusTimeout);
            message.ready ? showReady() : showInitialChoice();
        }

        if (message.type === 'DOWNLOAD_PROGRESS') {
            var percent = message.totalBytes ? (message.completedBytes / message.totalBytes) * 100 : (message.index / message.total) * 100;
            showProgress(message.label || 'Downloading Cebu map…', percent);
        }

        if (message.type === 'DOWNLOAD_COMPLETE') {
            showReady();
        }

        if (message.type === 'DOWNLOAD_ERROR') {
            showInitialChoice();
            setStatus('Could not save the map. Please try again while online.');
        }

        if (message.type === 'REMOVE_COMPLETE') {
            showInitialChoice();
            setStatus('Offline Cebu map removed.');
        }
    });

    navigator.serviceWorker.register(config.serviceWorkerUrl, { scope: '/' }).then(function (result) {
        registration = result;
        return navigator.serviceWorker.ready;
    }).then(function () {
        checkSavedMap();
    }).catch(function () {
        panel.hidden = true;
    });
}());
