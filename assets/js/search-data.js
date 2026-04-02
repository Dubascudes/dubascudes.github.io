// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-teaching",
          title: "teaching",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/teaching/";
          },
        },{id: "post-github-pages-gt-gt-wix",
        
          title: "GitHub Pages &gt;&gt; Wix",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/posts/2026/03/post/";
          
        },
      },{id: "post-something-about-3n-1",
        
          title: "Something about 3n + 1",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/posts/2025/02/collatz/";
          
        },
      },{id: "post-maintaining-a-blog-for-some-reason",
        
          title: "Maintaining a blog for some reason?",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/posts/2025/02/post/";
          
        },
      },{id: "post-starting-a-blog-for-some-reason",
        
          title: "Starting a blog for some reason.",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/posts/2024/11/initial-post/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-earned-my-bsc-in-computer-science-from-ucf",
          title: 'Earned my BSc in Computer Science from UCF',
          description: "",
          section: "News",},{id: "news-started-my-phd-in-computer-engineering-under-dr-rickard-ewetz",
          title: 'Started my PhD in Computer Engineering under Dr. Rickard Ewetz',
          description: "",
          section: "News",},{id: "news-my-first-paper-has-been-accepted-to-icmla",
          title: 'My first paper has been accepted to ICMLA!',
          description: "",
          section: "News",},{id: "news-my-paper-on-grammar-constrained-decoding-has-been-accepted-to-icml",
          title: 'My paper on grammar constrained decoding has been accepted to ICML!',
          description: "",
          section: "News",},{id: "projects-d-amp-d-character-editor-plugin-for-joplin",
          title: 'D&amp;amp;D Character Editor Plugin for Joplin',
          description: "A Joplin plugin to manage Dungeons &amp; Dragons 5e characters directly in your notes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/JoplinPlugin-DND/";
            },},{id: "projects-grammar-forced-ltl-translation",
          title: 'Grammar-Forced LTL Translation',
          description: "Grammar-forced decoding for translating natural language to temporal logic using LLMs.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/grammar-forced/";
            },},{id: "projects-nl-to-ltl-benchmark-suite",
          title: 'NL-to-LTL Benchmark Suite',
          description: "A benchmark dataset and evaluation suite for verifiable natural language to linear temporal logic translation.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/nl2ltl-benchmark/";
            },},{id: "projects-person-following-robot",
          title: 'Person Following Robot',
          description: "A robot that autonomously follows a person using computer vision and control.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/person-following-robot/";
            },},{id: "projects-safety-guided-flow-matching",
          title: 'Safety-Guided Flow Matching',
          description: "Neuro-symbolic safety guidance for vision-language-action models via constrained flow matching.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/safety-guided-flow/";
            },},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/WilliamEnglish_CV.pdf", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%77%69%6C%6C.%65%6E%67%6C%69%73%68@%75%66%6C.%65%64%75", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=Tv7zmMEAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
