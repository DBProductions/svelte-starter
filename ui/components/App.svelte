<div>
    <Headline message="{{message}}" />
    <List list="{{list}}"
          on:select="select(event)" />
</div>

<script type="text/javascript">
import Headline from './Headline.svelte';
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
        Headline,
        List
    }
};
</script>
