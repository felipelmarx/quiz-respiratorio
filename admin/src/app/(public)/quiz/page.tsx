import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiz Respiratório | iBreathwork',
  description: 'Descubra como está sua saúde respiratória com nosso quiz científico.',
}

export default function QuizPage() {
  return (
    <div className="min-h-screen">
      {/*
        The quiz is served as static files from /public/quiz/
        This page acts as a Next.js wrapper for the original quiz.
        The original index.html, app.js, quiz-data.js, styles.css
        are placed in public/quiz/ and the iframe loads them.

        Alternative: Copy the quiz HTML inline here as a client component.
        We use iframe for clean separation — the quiz JS is vanilla and
        doesn't need React overhead.
      */}
      <iframe
        src="/quiz/index.html"
        className="w-full h-screen border-0"
        title="Quiz Respiratório iBreathwork"
        allow="vibrate"
      />
    </div>
  )
}
