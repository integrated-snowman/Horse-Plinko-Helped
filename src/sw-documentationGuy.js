const template = document.createElement("template");
template.innerHTML = `
<style>

.card {
    height: 33px;
    width: 500px;
    display: flex;
    transition: box-shadow .3s;
    border: .2px solid;
    background-color: #bcb382 !important;
  }
  .card:hover {
    box-shadow: 0 0 11px rgba(33,33,33,.8); 
  }
  a {
    flex: 1;
    text-decoration: none !important;
  }
  h1,h2,h3,li{
    font-family: Oswald;
    color:#09814a;
  }
  

</style>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">
<body>
<div class="card">

<a id="url" href=""><li ><h3 id="text" class="is-size-5"></h3></li></a>


</div>
  </body>
`;



class documentationGuy extends HTMLElement{
    constructor(){
        super();
      //attach a shadowdom treeto this instance this creasts a shadown root for us
      this.attachShadow({mode:"open"});//allows debugging when open
      //clone template and append it
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.card = document.querySelector(".card");
      this.a1 = this.shadowRoot.querySelector("#url");
      this.text = this.shadowRoot.querySelector("#text");


    }

    connectedCallback(){

        this.render();
    }

    //once we hook this favro
    disconnectedCallback(){

    }


          //updating the code
     attributeChangedCallback(attributeName, oldVal, newVal){
        console.log(attributeName, oldVal, newVal);
        this.render();
    }
     //telling component to observe/watch these values
    static get observedAttributes(){
        return ["data-link"];}
    


     render(){
        const link = this.getAttribute('data-link') ? this.getAttribute('data-link') : "";
        const text = this.getAttribute('data-text') ? this.getAttribute('data-text') : "";


        this.a1.href=`${link}`;
        this.text.innerHTML=`${text}`;
             
     }
}//end class

customElements.define('sw-documentationguy',documentationGuy);