import React, {Component} from "react";
import Spinner from "../../Spinner";
import PollList from "../../PollList";

type HomeProps = {};
type HomeState = {
  error: null | string,
  isLoaded: boolean,
  currentPolls: Array<any>
}
class Home extends Component<HomeProps, HomeState>{
  constructor(props:HomeProps) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      currentPolls: []
    };
  }
  componentDidMount() {
    fetch("http://localhost:5000/api/getCurrentPolls")
      .then(res => res.json())
      .then((result) => {
        this.setState({
          isLoaded: true,
          currentPolls: result
        });
      },
      (error) => {
        console.log(error)
        this.setState({
          isLoaded: true,
          error
        });
      });
  }
  render() {
    const {error, isLoaded, currentPolls} = this.state;
    if (error) {
      return(
      <div>Something went wrong! Please Try again</div>
      );
    } else if(!isLoaded) {
      return(<Spinner className="home"/>)
    }else {
      return(
      <PollList currentPolls={currentPolls}/>
      )}
  }
}

export default Home;
