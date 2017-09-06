<div>
    <ul>
        {{#each list as item}}
            <ListItem item="{{item}}"
                      on:select="select(event)" />
        {{/each}}
    </ul>
</div>

<style>
ul {
    list-style: none;
}
</style>

<script type="text/javascript">
import ListItem from './ListItem.svelte';

export default {
    data () {
        return {
            list: []
        };
    },
    methods: {
        select (event) {
            this.fire('select', event);
        }
    },
    components: {
        ListItem
    }
};
</script>
