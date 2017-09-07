<div>
    <Headline message="{{message}}" />

    <List list="{{list}}"
          on:select="select(event)" />

    <UserInput userInput="{{userInput}}"
               result="{{result}}"
               on:input="input(event)" />
</div>

<script type="text/javascript">
import Headline from './Headline.svelte';
import List from './List.svelte';
import UserInput from './UserInput.svelte';

export default {
    data () {
        return {
            message: "Nothing clicked",
            userInput: "",
            result: "",
            list: []
        };
    },
    methods: {
        select (event) {
            this.fire('select', event);
        },
        input (event) {
            this.fire('input', event);
        }
    },
    components: {
        Headline,
        List,
        UserInput
    }
};
</script>
