const { Component } = React
const { render } = ReactDOM
const { Switch, Link, Route, HashRouter, Redirect } = ReactRouterDOM
const API = 'https://acme-users-api-rev.herokuapp.com/api/'

const fetchUser = async () => {
    const storage = window.localStorage
    const userId = storage.getItem("userId")
    if (userId) {
      try {
        return (await axios.get(`${API}users/detail/${userId}`)).data
      } catch (ex) {
        storage.removeItem("userId")
        return fetchUser()
      }
    }
    const user = (await axios.get(`${API}users/random`)).data
    storage.setItem("userId", user.id)
    return user
  }

const Header =({ user, bookmarks })=>{
    return  (<h1> 
                {user.fullName} ({bookmarks.length} Bookmarks)
            </h1>)
}

const NavBar = ({ props, bookmarks, categories}) => {
    const path = props.location.pathname.slice(1)
    return (<nav>
            <Link to="/" key={0} className={path==="" ? 'selected' : ''}>
                all
                ({bookmarks.length})
            </Link>
            {categories.map((category, idx)=>{
                return <Link to={`/${category}`} key={idx+1} className= {category===path ? 'selected' : ''}>
                            {category} 
                            ({bookmarks.filter(bookmark=>{
                                    return (bookmark.category===category)
                                }).length})
                        </Link>
                
                })}
            </nav>)
}

const List=({props, bookmarks, destroy, history})=>{
      const path = props.location.pathname.slice(1)
      return <ul>
            {bookmarks
                .filter((bookmark)=>{
                    if(path===''){
                        return bookmark
                    }else{
                        return (bookmark.category===path)
                    }
                    })
                .map((bookmark,idx)=>{
                    return (<li key={idx}>
                        <a href={`http://www.${bookmark.url}`}>{`http://www.${bookmark.url}`}</a>
                        <button onClick={()=>destroy({bookmark,history})}>Destroy</button>
                    </li>)
                    })}
            </ul>
}

class Form extends Component {
	constructor() {
		super()
		this.state = {
            url:'',
            category:''
        }
        this.create = this.create.bind(this)
    }

    async create() {
        const {history, create, user} = this.props;
        const {url, category} = this.state

        try {
          const bookmark = (await axios.post(`${API}users/${user.id}/bookmarks`, {url: url, category: category})).data;
          create({bookmark,history});
          this.setState({url:'',category:''})
        } catch (er) {
          console.log(er)
        }

    }

	render() {
        const { url,category } = this.state;
        return (<div id="formContainer">
                <form onSubmit={ this.create } history={ history }>
                    <input type="text" placeholder='url' value={url}
                            onChange={ (ev)=> this.setState({ url: ev.target.value})} />
                    <input type="text" placeholder='category' value={category}
                            onChange={ (ev)=> this.setState({ category: ev.target.value})} />
                    <button disabled={ url === '' || category===''}>Create</button>
                </form>
                </div>)
	}
	
}


class App extends Component {
	constructor() {
		super()
		this.state = {
            user:{},
            bookmarks:[],
            categories:[]
        }
        this.create = this.create.bind(this)
        this.destroy = this.destroy.bind(this)
    }

    async destroy({bookmark,history}) {
        const {bookmarks} = this.state
        const updated = bookmarks.filter(bookmarkItem => bookmark.id !== bookmarkItem.id);
        await axios.delete(`${API}users/${this.state.user.id}/bookmarks/${bookmark.id}`);
        const categories = updated.reduce((accum,elem)=>{
                if(!accum.includes(elem.category.toLowerCase())){
                    accum.push(elem.category.toLowerCase())
                }
                return accum
            },[])

        if(!categories.includes(bookmark.category)){
            history.push(`/`);
        }
        this.setState({ bookmarks:updated,categories })
    }

    async create({bookmark,history}) {
        const {bookmarks} = this.state;
        const updated = [...bookmarks, bookmark] 
        const categories = updated.reduce((accum,elem)=>{
                if(!accum.includes(elem.category.toLowerCase())){
                    accum.push(elem.category.toLowerCase())
                }
                return accum
            },[])
        history.push(`/${bookmark.category}`);
        this.setState({ categories, bookmarks:updated});
    }

	async componentDidMount() {
		const user = (await fetchUser());
        const bookmarks = (await axios.get(`${API}users/${user.id}/bookmarks`)).data
        const updated = bookmarks.reduce((accum,elem)=>{
                if(!accum.includes(elem.category.toLowerCase())){
                    accum.push(elem.category.toLowerCase())
                }
                return accum
            },[])
        this.setState({ user, bookmarks ,categories:updated});
    }
    
	render() {
        const {user, bookmarks,categories} = this.state
        const {create, destroy } = this
		return (<div>
            <HashRouter>
                <Route path="/:filter?" render={(props)=>{
                    return (<div>
                    <Header user ={user} bookmarks={bookmarks}/>
                    <NavBar props={props} history={props.history} bookmarks={bookmarks} categories={categories}/>
                    <Form props ={props} history={props.history} create={create} user={user}/>
                    <List props={props} history={props.history} bookmarks={bookmarks} destroy={destroy}/>
                    </div>)
                }} />
            </HashRouter>
        </div>)
	}
	
}

const root = document.querySelector("#root")
render(<App />, root)