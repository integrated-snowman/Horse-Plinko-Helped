const template = document.createElement("template");
template.innerHTML = `

<style>
#navbarGameFinder
{
  font-family: Roboto, sans-serif;

}
nav{
  background-color:#463f1a !important;
  border: 2px solid;
}
a:hover
{
  text-decoration: none !important;
  color:black !important;
}
a{
  color:#f9ebe0 !important;
}
.navbar-item:hover{
  background-color:#e5c687 !important;
}

</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">
<div id="bodyDiv">
<nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
          <a class="navbar-item" href="about.html">
            <img src="media/navbarBrand.png" width="112" height="28">
          </a>
      
          <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarGameFinder">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
      
        <div id="navbarGameFinder" class="navbar-menu">
          <div class="navbar-start">
            <a id="home" class="navbar-item" href="about.html">
              Home
            </a>
      
            <a id="app" class="navbar-item" href="index.html">
                App
              </a>

            <a id="documentation" class="navbar-item" href="documentation.html">
              Documentation
            </a>
      
          </div>
      
          <div class="navbar-end">
          </div>
        </div>
      </nav>
      </div>  
`;



class navBar extends HTMLElement{
    constructor(){
        super();
      //attach a shadowdom treeto this instance this creasts a shadown root for us
      this.attachShadow({mode:"open"});//allows debugging when open
      //clone template and append it
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this.home = this.shadowRoot.querySelector("#home");
      this.app = this.shadowRoot.querySelector("#app");
      this.favorites = this.shadowRoot.querySelector("#favorites");
      this.documentation = this.shadowRoot.querySelector("#documentation");
      this.navBarBurger = this.shadowRoot.querySelector(".navbar-burger");
      this.navbarMenu = this.shadowRoot.querySelector(".navbar-menu");
    }

    connectedCallback(){

        this.render();
        if (this.navBarBurger) this.navBarBurger.onclick = () => this.navbarMenu.classList.toggle('is-active');
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
        return ["data-currentPage"];}
    


     render(){
        //grabbing the current page
        const currentPage = this.getAttribute('data-currentPage') ? this.getAttribute('data-currentPage') : "poop";
       
        if(currentPage=="app")
        {
          this.shadowRoot.querySelector("#app").innerHTML="App".bold();
        }
        
        else if(currentPage=="sources")
        {
          this.shadowRoot.querySelector("#documentation").innerHTML="Documentation".bold();
        }
        else
        {
          this.shadowRoot.querySelector("#home").innerHTML="Home".bold();
        }
        
             
     }
}//end class

customElements.define('sw-nav',navBar);
