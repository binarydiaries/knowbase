import { useAuth, useClerk } from '@clerk/clerk-react'

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:4001'

interface Props {
    className?: string
    children: React.ReactNode
}

const GetStartedButton = ({ className, children }: Props) => {
    const { isSignedIn, isLoaded } = useAuth()
    const { redirectToSignIn } = useClerk()

    const handleClick = () => {
        if (!isLoaded) return

        if (isSignedIn) {
            window.location.href = APP_URL
        } else {
            redirectToSignIn({ afterSignInUrl: APP_URL })
        }
    }

    return (
        <button onClick={handleClick} className={className}>
            {children}
        </button>
    )
}

export default GetStartedButton
