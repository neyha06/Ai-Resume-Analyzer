import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoading(true);

      const resumes = (await kv.list("resume:*", true)) as KVItem[];
      const parsedResumes=  resumes?.map((resume)=> (
        JSON.parse(resume.value) as Resume
      ));

      console.log("parsedResumes:", parsedResumes);
      setResumes(parsedResumes || []);
      setIsLoading(false);
    }

    loadResumes();
  },[]);

  //if user tries to access a secure route and there are not logged in, redirect to login/auth and then back to the secure route after login
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);



  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-60">
          <h1>Track Your Application & Resume Rating</h1>
          {
            !isLoading && resumes?.length === 0 ? (
              <h2>No resumes found. Upload your first resume!</h2>
            ) : (
              <h2>Review your resume and check AI powered feedback.</h2>
            )
          }
        </div>

        {
          isLoading && (
            <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" alt="resume-scan" />
            </div>
          )
        }

        {(!isLoading && resumes?.length > 0 )&& (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {
          isLoading && resumes?.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 gap-4">
              <Link to="/upload" className="primary-button w-fit text-xl font-semibold">Upload Resume</Link>
              
            </div>
          )
        }
      </section>
    </main>
  );
}
