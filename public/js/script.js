function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

// TODO this is out of date
function destroyEach(iterations, detach, start) {
	for (var i = start; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].destroy(detach);
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = this._state = null;
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	if (this._root._lock) return;
	this._root._lock = true;
	callAll(this._root._beforecreate);
	callAll(this._root._oncreate);
	callAll(this._root._aftercreate);
	this._root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state, oldState, false);
	if (this._bind) this._bind(changed, this._state);
	dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
	this._fragment.update(changed, this._state);
	dispatchObservers(this, this._observers.post, changed, this._state, oldState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function _mount(target, anchor) {
	this._fragment.mount(target, anchor);
}

function _unmount() {
	this._fragment.unmount();
}

var proto = {
	destroy: destroy,
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	teardown: destroy,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};

var template$1 = (function () {
return {
    data () {
        return {
            name: ''
        };
    }
};
}());

function create_main_fragment$1 ( state, component ) {
	var div, text;

	return {
		create: function () {
			div = createElement( 'div' );
			text = createText( "XXX" );
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( text, div );
		},

		update: noop,

		unmount: function () {
			detachNode( div );
		},

		destroy: noop
	};
}

function Selection ( options ) {
	this.options = options;
	this._state = assign( template$1.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	this._fragment = create_main_fragment$1( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign( Selection.prototype, proto );

var template$3 = (function () {
return {
    data () {
        return {
            item: {id: 0, name: ''}
        };
    },
    methods: {
        select (item) {
            this.fire('select', {item: item});
        }
    }
};
}());

function encapsulateStyles ( node ) {
	setAttribute( node, 'svelte-1872953346', '' );
}

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-1872953346-style';
	style.textContent = "div[svelte-1872953346],[svelte-1872953346] div{border:1px solid #ccc;margin-bottom:3px;padding:7px;cursor:pointer}";
	appendNode( style, document.head );
}

function create_main_fragment$3 ( state, component ) {
	var div, text_value = state.item.name, text;

	function click_handler ( event ) {
		var state = component.get();
		component.select(state.item);
	}

	return {
		create: function () {
			div = createElement( 'div' );
			text = createText( text_value );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles( div );
			addListener( div, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( text, div );
		},

		update: function ( changed, state ) {
			if ( ( changed.item ) && text_value !== ( text_value = state.item.name ) ) {
				text.data = text_value;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			removeListener( div, 'click', click_handler );
		}
	};
}

function ListItem ( options ) {
	this.options = options;
	this._state = assign( template$3.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-1872953346-style' ) ) add_css();

	this._fragment = create_main_fragment$3( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign( ListItem.prototype, template$3.methods, proto );

var template$2 = (function () {
return {
    data () {
        return {
            list: []
        };
    },
    methods: {
        select (event) {
            this.fire('select', event);
        }
    }
};
}());

function create_main_fragment$2 ( state, component ) {
	var div;

	var each_block_value = state.list;

	var each_block_iterations = [];

	for ( var i = 0; i < each_block_value.length; i += 1 ) {
		each_block_iterations[i] = create_each_block( state, each_block_value, each_block_value[i], i, component );
	}

	return {
		create: function () {
			div = createElement( 'div' );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].create();
			}
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].mount( div, null );
			}
		},

		update: function ( changed, state ) {
			var each_block_value = state.list;

			if ( changed.list || changed.event ) {
				for ( var i = 0; i < each_block_value.length; i += 1 ) {
					if ( each_block_iterations[i] ) {
						each_block_iterations[i].update( changed, state, each_block_value, each_block_value[i], i );
					} else {
						each_block_iterations[i] = create_each_block( state, each_block_value, each_block_value[i], i, component );
						each_block_iterations[i].create();
						each_block_iterations[i].mount( div, null );
					}
				}

				for ( ; i < each_block_iterations.length; i += 1 ) {
					each_block_iterations[i].unmount();
					each_block_iterations[i].destroy();
				}
				each_block_iterations.length = each_block_value.length;
			}
		},

		unmount: function () {
			detachNode( div );

			for ( var i = 0; i < each_block_iterations.length; i += 1 ) {
				each_block_iterations[i].unmount();
			}
		},

		destroy: function () {
			destroyEach( each_block_iterations, false, 0 );
		}
	};
}

function create_each_block ( state, each_block_value, item, item_index, component ) {
	var div;

	var listitem = new ListItem({
		_root: component._root,
		data: { item: item }
	});

	listitem.on( 'select', function ( event ) {
		component.select(event);
	});

	return {
		create: function () {
			div = createElement( 'div' );
			listitem._fragment.create();
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			listitem._mount( div, null );
		},

		update: function ( changed, state, each_block_value, item, item_index ) {
			var listitem_changes = {};
			if ( changed.list ) listitem_changes.item = item;
			listitem._set( listitem_changes );
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			listitem.destroy( false );
		}
	};
}

function List ( options ) {
	this.options = options;
	this._state = assign( template$2.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !options._root ) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$2( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( List.prototype, template$2.methods, proto );

var template = (function () {
return {
    data () {
        return {
            message: "Nothing clicked",
            list: []
        };
    },
    methods: {
        select (event) {
            this.fire('select', event);
        }
    }
};
}());

function create_main_fragment ( state, component ) {
	var div, h1, text, text_1;

	var list = new List({
		_root: component._root,
		data: { list: state.list }
	});

	list.on( 'select', function ( event ) {
		component.select(event);
	});

	return {
		create: function () {
			div = createElement( 'div' );
			h1 = createElement( 'h1' );
			text = createText( state.message );
			text_1 = createText( "\n    " );
			list._fragment.create();
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( h1, div );
			appendNode( text, h1 );
			appendNode( text_1, div );
			list._mount( div, null );
		},

		update: function ( changed, state ) {
			if ( changed.message ) {
				text.data = state.message;
			}

			var list_changes = {};
			if ( changed.list ) list_changes.list = state.list;
			list._set( list_changes );
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			list.destroy( false );
		}
	};
}

function App ( options ) {
	this.options = options;
	this._state = assign( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !options._root ) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( App.prototype, template.methods, proto );

const app = new App({
    target: document.querySelector('app'),
    data: {
        list: [{ id: 1, name: 'Babel' }, { id: 2, name: 'Svelte' }, { id: 2, name: 'Rollup' }]
    }
});

app.on('select', event => {
    app.set({ message: 'Clicked item ' + event.item.name });
});
