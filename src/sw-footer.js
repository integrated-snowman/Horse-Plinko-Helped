const template = document.createElement("template");
template.innerHTML = `

<style>
footer{
  background-color: #e5c687;

}
</style>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">



<div id="footerHolder">
<footer>
  <div class="content has-text-centered">
    <p>
      <strong>HorsePlinko</strong> by <a href="https://matthewratzell.com">Matthew Ratzell</a>. 
    </p>
  </div>
</footer>
</div>
`;



class footer extends HTMLElement{
    constructor(){
        super();
      //attach a shadowdom treeto this instance this creasts a shadown root for us
      this.attachShadow({mode:"open"});//allows debugging when open
      //clone template and append it
      this.shadowRoot.appendChild(template.content.cloneNode(true));


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
        return [""];}
    


     render(){
        //grabbing the current page
       
        
             
     }
}//end class

customElements.define('sw-footer',footer);