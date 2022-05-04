import { GetStaticPaths, GetStaticProps } from 'next';

import * as prismic from '@prismicio/client';
import Image from 'next/image';
import {
  AiOutlineCalendar,
  AiOutlineUser,
  AiOutlineClockCircle,
} from 'react-icons/ai';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post(props: PostProps): JSX.Element {
  const { post } = props;
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Header />
        <div>
          <h1>Carregando...</h1>
        </div>
      </>
    );
  }

  const numberWords = post.data.content.reduce((sum, content) => {
    const bodySize = RichText.asText(content.body)
      .trim()
      .replace(/[\s]+/g, ' ')
      .split(' ').length;

    return sum + bodySize;
  }, 0);

  const estimatedTime = Math.ceil(numberWords / 200);

  return (
    <>
      <Header />
      <div className={styles.banner}>
        <Image src={post.data.banner.url} layout="fill" objectFit="cover" />
      </div>
      <div className={commonStyles.container}>
        <div className={styles.heading}>
          <div className={styles.title}>
            <h1>{post.data.title}</h1>
          </div>
          <div className={styles.subheading}>
            <div>
              <AiOutlineCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div>
              <AiOutlineUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <AiOutlineClockCircle />
              <span>{estimatedTime} min</span>
            </div>
          </div>
          <div>
            {post.data.content.map(bodyContent => (
              <div key={bodyContent.heading}>
                <div className={styles.contentHeading}>
                  <h2>{bodyContent.heading}</h2>
                </div>
                <div
                  className={styles.postContent}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(bodyContent.body),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismicClient = getPrismicClient({});
  const posts = await prismicClient.getByType('posts', {
    predicates: [prismic.predicate.at('document.type', 'posts')],
    fetch: ['posts.slug'],
    pageSize: 2,
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismicClient = getPrismicClient({});
  const response = await prismicClient.getByUID('posts', slug as string);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      banner: response.data.banner,
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
