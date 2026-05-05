import { useAuth, useClerk } from '@clerk/clerk-react'
import amplitude from '../lib/amplitude'

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:4001'

interface Props {
    className?: string
    children: React.ReactNode
    source?: string
    planName?: string
}

const GetStartedButton = ({ className, children, source = 'hero', planName }: Props) => {
    const { isSignedIn, isLoaded } = useAuth()
    const { redirectToSignIn } = useClerk()

    const handleClick = () => {
        if (!isLoaded) return

        amplitude.track('Get Started Clicked', {
            source,
            ...(planName ? { plan_name: planName } : {}),
            is_signed_in: isSignedIn ?? false,
        })

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
