<div>
    <Headline message="{{message}}"
              itemId="{{itemId}}" />

    <List list="{{list}}"
          on:select="select(event)" />

    <ModalDialog showModal="{{showModal}}"
                 headline="{{headline}}" />

    <UserInput userInput="{{userInput}}"
               result="{{result}}"
               on:input="input(event)" />
</div>

<script type="text/javascript">
import Headline from './Headline.svelte';
import List from './List.svelte';
import ModalDialog from './ModalDialog.svelte';
import UserInput from './UserInput.svelte';

export default {
    data () {
        return {
            message: 'Nothing clicked',
            itemId: '',
            userInput: '',
            result: '',
            list: [],
            showModal: false
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
        ModalDialog,
        UserInput
    }
};
</script>
