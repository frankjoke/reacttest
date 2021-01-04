import React from "react";
class HtmlComponent extends React.Component {
    	
    constructor(props) {

        super(props);		
        this.divRef = React.createRef();
        const {html, ...rest} = props;
        this.myHTML = html;
        this.rest = rest;
    }
    	
    componentDidMount() {

        this.divRef.current.innerHTML = this.myHTML;
    }
    	
    render() {

        return (

            <div ref={this.divRef} {...this.rest}></div>
        );
    }
}
export default HtmlComponent;