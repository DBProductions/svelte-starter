<input type="text" bind:value="userInput" on:keyup="keypress()"> {{userInput}}

{{#if result}}
    <div>{{result}}</div>
{{/if}}

<style>
input {
    border-radius: 3px 3px 3px 3px;
    margin-left: 40px;
    margin-right: 20px;
    font-size: 12pt;
}
div {
    margin-left: 40px;
    margin-top: 10px;
    font-size: 12pt;
}
</style>

<script type="text/javascript">
export default {
    data () {
        return {
            userInput: "",
            result: ""
        };
    },
    methods: {
        keypress () {
            let input = this.get('userInput');
            this.fire('input', {'input': input});
        }
    },
};
</script>
