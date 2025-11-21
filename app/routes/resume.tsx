import type { s } from 'node_modules/react-router/dist/development/index-react-server-client-rcoGPJhU.mjs';
import React, { use, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ATS from '~/components/ATS';
import Details from '~/components/Details';
import Summary from '~/components/Summary';
import { usePuterStore } from '~/lib/puter';

export const meta = () => ([
  { title: "RESUMIND |  Review" },
  {
    name: "description",
    content: "Detailed overview of your resume",
  },
]);

const resume = () => {
    const {id}= useParams();
    const {auth,isLoading, fs, kv} = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [auth.isAuthenticated, isLoading]);

    useEffect(() => {
        const loadResume = async () => {
            // Fetch resume data using the id
            const response = await kv.get(`resume:${id}`);
            if(!response){
                return;
            }
            const data = JSON.parse(response); // files from puter cloud storage are returned as blobs and we need to convert them from PDF blob to pdf & img blob to img file
            
            const resumeBlob= await fs.read(data.resumePath);
            if(!resumeBlob)return;
            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob= await fs.read(data.imagePath);
            if(!imageBlob)return;
            const imgBlob = new Blob([imageBlob], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(imgBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
             console.log('resumeUrl:', resumeUrl);
        console.log('imageUrl:', imageUrl); 
        console.log('feedback:', data.feedback);

            }
        loadResume(); 
          
    }, []);

return (
    <main className='!pt-0'>
        <nav className='resume-nav'>
            <Link to="/" className='back-button'>
                <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5'/>
                    <span className='text-gray-800 text-sm font-semibold'>Back to Homepage</span>
            </Link>
        </nav>
    <div className='flex flex-row w-full max-lg:flex-col-reverse'>
        {/* max-lg:flex-col-reverse  : we use this for mobile devices,
because we show some more imp content first because we cannot fit both things at the same time
on mobile but in desktop both things can fit so we show in normal order
        */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
            {imageUrl && resumeUrl && (
                <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-2xl:h-fit w-fit'>
                    <a href={resumeUrl}target='_blank'>
                        <img 
                            src={imageUrl}
                            className='w-full h-full object-cover rounded-2xl'
                            title='resume'
                        />
                    </a>

                </div>
            )}
        </section>

        {/* Feedback section:  */}
        <section className="feedback-section">
            <h2 className='text-4xl text-black font-bold'>Resume Review</h2>
            {feedback? (
                <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
                    <Summary feedback= {feedback}/>
                    <ATS score= {feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []}/>
                    <Details feedback={feedback}/>
                </div>
            ): <img src='/images/resume-scan-2.gif' className='w-full' alt='analyzing your resume'>
            </img>
            }
        </section>
    </div>

 </main>
);
}

export default resume       