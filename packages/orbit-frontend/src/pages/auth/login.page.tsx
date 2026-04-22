// pages/auth/login.page.tsx
import { SignIn, useAuth } from "@clerk/react"
import { Navigate, useSearch } from "@tanstack/react-router"

export default function LoginPage() {
	const { isSignedIn } = useAuth()
	const search = useSearch({ strict: false }) as { redirect?: string }

	if (isSignedIn) {
		return <Navigate to={search.redirect || "/"} />
	}

	return (
		<div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
			<SignIn
				fallbackRedirectUrl={search.redirect || "/"}
				signUpFallbackRedirectUrl={search.redirect || "/"}
			/>
		</div>
	)
}
