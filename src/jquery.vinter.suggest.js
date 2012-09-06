(function ($, undef) {

	$.fn.suggest = function (settings) {
		var defaults = {
			url: '',
			cssClasses: {
				hover: 's-hover',
				focus: 's-focus',
				closing: 's-closing',
				suggestResult: 'suggest'
			},
			queryParam: 'q',
			dataType: 'json',
			minCharacters: 1,
			highlightMatches: true,
			onSelect: undef,
			autoSubmit: true,
			parseResponse: function (data, query, cb) {
				cb(data, query);
			}
		},
		jsonTimeout, index = 0;

		settings = $.extend(defaults, settings);

		return this.each(function () {

			var input = $(this),
				results = $('<ul />'),
				uniqueClass = 'suggest-' + (++index),
				selectedItem;

			/**
			* Set the selected item text value to the search input.
			*
			* @method setSuggestItem
			* @param {Object} item The selected item.
			*/
			function setSuggestItem(item) {

				return function () {

					input.val(item.text);
					results.html('').hide();

					if (typeof settings.onSelect === 'function') {
						settings.onSelect(item);
					}

					if (settings.autoSubmit) {
						input.closest('form').submit();
					}

				};
			}

			/**
			* Set a CSS class to the hovered item.
			*
			* @method setHoverClass
			* @param {Object} item The hovered item.
			*/
			function setHoverState(item) {

				return function () {
					results.find('li').removeClass(settings.cssClasses.hover);

					if (item) {
						input.val(item.text());
						item.addClass(settings.cssClasses.hover);
					}

					selectedItem = item;
				};
			}

			/**
			* Render the suggestion list.
			*
			* @method renderSuggestions
			* @param {String} query The search query.
			* @param {Array} resultArray The results of the query.
			*/
			function renderSuggestions(resultArray, query) {

				var i, filterPatt = new RegExp('(' + query + ')', 'ig');

				results.html('').hide();

				for (i = 0; i < resultArray.length; i++) {

					var item = $('<li />'),
						text = resultArray[i].text;

					if (settings.highlightMatches === true) {
						text = text.replace(filterPatt, '<strong>$1</strong>');
					}

					item.append(text)
						.click(setSuggestItem(resultArray[i]))
						.mouseover(setHoverState(item));



					results.append(item);
				}

				if (results.find('li').length > 0) {
					selectedItem = undef;
					results.show();
				}
			}

			/**
			* Get suggestions.
			*
			* @method getSuggestions
			*/
			function getSuggestions() {

				if (settings.url && typeof settings.url === 'string') {

					var query = input.val();

					if (results.find('li').length === 0) {
						results.html('<li class="s-searching">Searching...</li>').show();
					}

					clearTimeout(jsonTimeout);

					jsonTimeout = setTimeout(function () {
						var params = {};

						params[settings.queryParam] = query;

						$.get(settings.url, params, function (data) {
							if (data) {
								settings.parseResponse(data, query, renderSuggestions);
							}
							else {
								results.html('').hide();
							}
						}, settings.dataType);
					}, 300);
				}
			}

			/**
			* Bind actions to key up events in the input box.
			*
			* @method keyBindings
			* @param {Object} e The jQuery event object.
			*/
			function keyBindings(e) {

				switch (e.keyCode) {

					case 13: // enter
						$(selectedItem).trigger('click');
						return false;

					case 40: // down
						if (selectedItem === undef) {
							setHoverState(results.find('li:first').eq(0))();
						} else {
							if (selectedItem[0] !== results.find('li:last')[0]) {
								setHoverState(selectedItem.next().eq(0))();
							}
						}

						return false;

					case 38: // up

						if (selectedItem === undef) {
							setHoverState(results.find('li:last').eq(0))();
						} else {
							if (selectedItem[0] !== results.find('li:first')[0]) {
								setHoverState(selectedItem.prev().eq(0))();
							}
						}

						return false;

					default:
						getSuggestions();
						return true;
				}
			}

			results.addClass(settings.cssClasses.suggestResult + ' ' + uniqueClass).hide();

			input
				.attr('autocomplete', 'off')
				.addClass(uniqueClass)
				.after(results)
				.keyup(keyBindings)
				.focus(function () {

					if (input.val().length) {
						getSuggestions();
					}

					$(document).on('click.suggest', function (e) {
						if (!$(e.target).hasClass(uniqueClass)) {
							results.addClass(settings.cssClasses.closing);
							results.slideUp(150, function () {
								input.removeClass(settings.cssClasses.focus);
								results.removeClass(settings.cssClasses.closing);
							});
							$(document).off('click.suggest');
						}
					});

					input.addClass(settings.cssClasses.focus);
				});
		});
	};

}(jQuery));
