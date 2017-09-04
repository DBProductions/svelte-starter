<div>
    <h1>{{message}}</h1>
    <List list="{{list}}"
          on:select="select(event)">
</div>

<script type="text/javascript">
import Selection from './Selection.svelte';
import List from './List.svelte';

export default {
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
    },
    components: {
        Selection,
        List
    }
};
</script>
