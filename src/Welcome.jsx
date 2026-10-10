import { Link } from 'react-router-dom'

function Welcome() {
    return (
        <div className="welcome">
            <h1>Welcome back!</h1>
            <p>Ready to check your spending?</p>
            <Link to="/dashboard" className="dashboard-btn">
            Go to Dashboard
            </Link>
        </div>
    )
}

export default Welcome 