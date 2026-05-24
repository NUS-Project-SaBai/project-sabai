export default function ErrorScreen({ error, reset }: { error: Error; reset: () => void }) {
    return <div>
        <h1>Oops, something has gone wrong.</h1>
        <p>{error?.message}</p>
        <button onClick={reset}>Try again</button>
    </div>    
}
