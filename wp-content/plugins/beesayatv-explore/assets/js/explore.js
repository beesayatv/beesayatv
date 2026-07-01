document.addEventListener('DOMContentLoaded', function () {

	const sidebar = document.querySelector('.btv-sidebar');
	const search = document.getElementById('btv-search');

	let searchTimer;

	if (!sidebar) {
		return;
	}

	/*
	|--------------------------------------------------------------------------
	| Checkbox Filters
	|--------------------------------------------------------------------------
	*/

	sidebar.addEventListener('change', function (event) {

		if (event.target.matches('input[type="checkbox"]')) {
			filterTrails();
		}

	});

	/*
	|--------------------------------------------------------------------------
	| Search
	|--------------------------------------------------------------------------
	*/

	if (search) {

		search.addEventListener('input', function () {

			clearTimeout(searchTimer);

			searchTimer = setTimeout(function () {

				filterTrails();

			}, 300);

		});

	}

/*
|--------------------------------------------------------------------------
| Accordion Filters
|--------------------------------------------------------------------------
*/

document.querySelectorAll('.btv-filter-toggle').forEach(function (button) {

	button.addEventListener('click', function () {

		const group = button.closest('.btv-filter-group');

		document.querySelectorAll('.btv-filter-group').forEach(function (item) {

			if (item !== group) {
				item.classList.remove('is-open');
			}

		});

		group.classList.toggle('is-open');

	});

});

	/*
	|--------------------------------------------------------------------------
	| Clear Filters
	|--------------------------------------------------------------------------
	*/

	document.addEventListener('click', function (event) {

		if (!event.target.classList.contains('btv-clear-filters')) {
			return;
		}

		document.querySelectorAll('.btv-sidebar input[type="checkbox"]')
			.forEach(function (checkbox) {
				checkbox.checked = false;
			});

		if (search) {
			search.value = '';
		}

		filterTrails();

	});

	/*
	|--------------------------------------------------------------------------
	| Loading State
	|--------------------------------------------------------------------------
	*/

	function setLoading(isLoading) {

		const results = document.getElementById('btv-results');

		if (!results) {
			return;
		}

		if (isLoading) {
			results.classList.add('is-loading');
		} else {
			results.classList.remove('is-loading');
		}

	}

	/*
	|--------------------------------------------------------------------------
	| AJAX Filter
	|--------------------------------------------------------------------------
	*/

	function filterTrails() {

		const formData = new FormData();

		formData.append('action', 'btv_filter_trails');
		formData.append('nonce', btvExplore.nonce);

		// Search
		if (search) {
			formData.append('search', search.value);
		}

		// Taxonomies
		[
			'trail_location',
			'trail_difficulty',
			'trail_type'
		].forEach(function (taxonomy) {

			document.querySelectorAll(
				'input[name="' + taxonomy + '[]"]:checked'
			).forEach(function (checkbox) {

				formData.append(
					taxonomy + '[]',
					checkbox.value
				);

			});

		});

		setLoading(true);

		fetch(btvExplore.ajaxUrl, {
			method: 'POST',
			body: formData
		})
		.then(function (response) {
			return response.json();
		})
		.then(function (response) {

			setLoading(false);

			if (!response.success) {
				return;
			}

			const results = document.getElementById('btv-results');

			if (results) {
				results.innerHTML = response.data.html;
			}

		})
		.catch(function (error) {

			setLoading(false);
			console.error(error);

		});

	}

});