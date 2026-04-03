import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, PanelSection } from './common';
import { FeaturePanelFrame, type FeaturePanelMetric, type FeaturePanelStatus } from './common/FeaturePanelFrame';
import { educationSystem, mediaSystem, religionSystem } from '@/society/MediaEducationReligion';

export type SocietyPanelAction =
  | 'publish-bulletin'
  | 'open-school'
  | 'found-faith'
  | 'blend-beliefs'
  | 'refresh';

export interface SocietyPanelSnapshot {
  headlines: number;
  schools: number;
  religions: number;
  trust: number;
  knowledge: number;
  headlineMood: number;
  schoolName: string;
  newsroomName: string;
}

export interface SocietyFeaturePanelProps {
  className?: string;
  onAction?: (action: SocietyPanelAction) => void;
  onSnapshotChange?: (snapshot: SocietyPanelSnapshot) => void;
}

const SOCIETY_EDITOR_ID = 'panel-society-editor';
const SOCIETY_READER_ID = 'panel-society-reader';
const SOCIETY_STUDENT_ID = 'panel-society-student';
const SOCIETY_FOUNDER_A = 'panel-society-founder-a';
const SOCIETY_FOUNDER_B = 'panel-society-founder-b';

const societySeed = {
  seeded: false,
  newsroomId: '',
  schoolId: '',
  religionAId: '',
  religionBId: '',
};

function seedSocietyBaseline(): void {
  if (societySeed.seeded) return;

  const newsroom = mediaSystem.createNewspaper(SOCIETY_EDITOR_ID, 'Civic Dispatch');
  const school = educationSystem.createSchool(SOCIETY_EDITOR_ID, 'Civic Academy', 96, 8);
  educationSystem.hireTeacher(school.id, 'panel-teacher-1');
  educationSystem.enrollStudent(school.id, SOCIETY_STUDENT_ID);
  educationSystem.updateKnowledge(SOCIETY_STUDENT_ID, 18);

  const religionA = religionSystem.createReligion(
    SOCIETY_FOUNDER_A,
    'Civic Humanism',
    'A public ethic built on evidence, shared memory, and mutual care.',
    [
      { name: 'truth', description: 'Evidence should be visible and testable.' },
      { name: 'care', description: 'Public systems should protect the vulnerable.' },
      { name: 'craft', description: 'Knowledge should remain usable.' },
    ]
  );

  const religionB = religionSystem.createReligion(
    SOCIETY_FOUNDER_B,
    'Astral Commonweal',
    'A ritual tradition centered on long arcs of continuity and civic renewal.',
    [
      { name: 'continuity', description: 'Institutions should outlast a single season.' },
      { name: 'renewal', description: 'Communities must be able to adapt.' },
      { name: 'ritual', description: 'Shared ceremonies stabilize memory.' },
    ]
  );

  religionSystem.convert(SOCIETY_READER_ID, religionA.id);
  mediaSystem.follow(SOCIETY_READER_ID, SOCIETY_EDITOR_ID);
  mediaSystem.setCitizenMediaTrust(SOCIETY_READER_ID, 72);

  mediaSystem.publishArticle(
    newsroom.id,
    SOCIETY_EDITOR_ID,
    'Morning civic bulletin',
    'A new school opens beside a newsroom, and the first public stories immediately spread through the narrative mesh.',
    ['education', 'media', 'community']
  );
  mediaSystem.propagateNews(mediaSystem.getHeadlines()[0]?.id ?? '', [SOCIETY_READER_ID, SOCIETY_STUDENT_ID]);

  societySeed.seeded = true;
  societySeed.newsroomId = newsroom.id;
  societySeed.schoolId = school.id;
  societySeed.religionAId = religionA.id;
  societySeed.religionBId = religionB.id;
}

function buildSocietySnapshot(extraFaithCount: number): SocietyPanelSnapshot {
  const headlines = mediaSystem.getHeadlines();
  const schools = educationSystem.getAllSchools();
  const religionA = religionSystem.getCitizenReligion(SOCIETY_FOUNDER_A);
  const religionB = religionSystem.getCitizenReligion(SOCIETY_FOUNDER_B);

  return {
    headlines: headlines.length,
    schools: schools.length,
    religions: [religionA, religionB].filter(Boolean).length + extraFaithCount,
    trust: mediaSystem.getCitizenMediaTrust(SOCIETY_READER_ID),
    knowledge: educationSystem.getCitizenEducationLevel(SOCIETY_STUDENT_ID),
    headlineMood: headlines[0]?.sentiment ?? 0,
    schoolName: schools[0]?.name ?? 'Civic Academy',
    newsroomName: mediaSystem.getNewspaper(societySeed.newsroomId)?.name ?? 'Civic Dispatch',
  };
}

function metricsFromSnapshot(snapshot: SocietyPanelSnapshot): FeaturePanelMetric[] {
  return [
    { label: '头条', value: snapshot.headlines.toString(), detail: '流通中的公共故事。' },
    { label: '学校', value: snapshot.schools.toString(), detail: `当前校园：${snapshot.schoolName}。` },
    { label: '信念层', value: snapshot.religions.toString(), detail: '已播种并激活的信念图谱。' },
    { label: '读者信任', value: `${snapshot.trust.toFixed(0)}%`, progress: snapshot.trust, detail: '受众信心。' },
    { label: '学习等级', value: `${snapshot.knowledge.toFixed(0)}`, progress: snapshot.knowledge, detail: '学生成长。' },
  ];
}

function statusesFromSnapshot(snapshot: SocietyPanelSnapshot): FeaturePanelStatus[] {
  return [
    { label: '新闻室在线', tone: 'native' },
    { label: snapshot.headlineMood >= 0 ? '正向语气' : '批判语气', tone: snapshot.headlineMood >= 0 ? 'native' : 'fallback' },
    { label: '信念网络已激活', tone: 'native' },
  ];
}

export function SocietyFeaturePanel({
  className = '',
  onAction,
  onSnapshotChange,
}: SocietyFeaturePanelProps) {
  seedSocietyBaseline();

  const [revision, setRevision] = useState(0);
  const [extraFaithFounders, setExtraFaithFounders] = useState<string[]>([]);

  const snapshot = useMemo(() => buildSocietySnapshot(extraFaithFounders.length), [revision, extraFaithFounders.length]);
  const headlines = mediaSystem.getHeadlines();
  const schools = educationSystem.getAllSchools();
  const religionA = religionSystem.getCitizenReligion(SOCIETY_FOUNDER_A);
  const religionB = religionSystem.getCitizenReligion(SOCIETY_FOUNDER_B);
  const extraFaiths = extraFaithFounders
    .map((founderId) => religionSystem.getCitizenReligion(founderId))
    .filter(Boolean) as NonNullable<ReturnType<typeof religionSystem.getCitizenReligion>>[];
  const activeReligions = [religionA, religionB, ...extraFaiths].filter(Boolean) as NonNullable<
    ReturnType<typeof religionSystem.getCitizenReligion>
  >[];

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  const refresh = () => {
    onAction?.('refresh');
    setRevision((value) => value + 1);
  };

  const publishBulletin = () => {
    onAction?.('publish-bulletin');
    const newsroomId = societySeed.newsroomId;
    const title = `市民通报 ${headlines.length + 1}`;
    const content = [
      '新闻室、学校与信念网络共享同一张社会图谱。',
      '这条新通报强调故事、知识与仪式现在如何一起流动。',
    ].join(' ');
    const article = mediaSystem.publishArticle(
      newsroomId,
      SOCIETY_EDITOR_ID,
      title,
      content,
      ['newsroom', 'school', 'belief']
    );
    mediaSystem.propagateNews(article.id, [SOCIETY_READER_ID, SOCIETY_STUDENT_ID]);
    mediaSystem.setCitizenMediaTrust(SOCIETY_READER_ID, Math.min(100, snapshot.trust + 4));
    educationSystem.updateKnowledge(SOCIETY_STUDENT_ID, 4);
    setRevision((value) => value + 1);
  };

  const openSchool = () => {
    onAction?.('open-school');
    const campus = educationSystem.createSchool(
      SOCIETY_EDITOR_ID,
      `Civic Academy ${schools.length + 1}`,
      120,
      6
    );
    educationSystem.hireTeacher(campus.id, `panel-teacher-${schools.length + 1}`);
    educationSystem.enrollStudent(campus.id, SOCIETY_STUDENT_ID);
    educationSystem.updateKnowledge(SOCIETY_STUDENT_ID, 6);
    setRevision((value) => value + 1);
  };

  const foundFaith = () => {
    onAction?.('found-faith');
    const founderId = `panel-faith-founder-${Date.now()}`;
    const religion = religionSystem.createReligion(
      founderId,
      `Common Rite ${snapshot.religions + 1}`,
      'A compact civic ritual that keeps memory, learning, and public duty in view.',
      [
        { name: 'memory', description: 'The past should stay legible.' },
        { name: 'duty', description: 'Public trust is a shared task.' },
        { name: 'renewal', description: 'Institutions must stay adaptable.' },
      ]
    );
    religionSystem.convert(SOCIETY_READER_ID, religion.id);
    setExtraFaithFounders((current) => [...current, founderId]);
    setRevision((value) => value + 1);
  };

  const blendBeliefs = () => {
    onAction?.('blend-beliefs');
    if (religionA && religionB) {
      religionSystem.memePropagation(religionA.id, religionB.id);
      religionSystem.convert(SOCIETY_READER_ID, religionB.id);
    }
    setRevision((value) => value + 1);
  };

  return (
    <FeaturePanelFrame
      className={className}
      eyebrow="社会 / 文化 / 叙事"
      title="社会织网控制台（Social Fabric Console）"
      description="新闻、学校与信念系统共享同一张影响图。下面的每个动作都会直接改写实时单例，所以这个面板更像一件可工作的市民工具，而不是静态示意图。"
      status={statusesFromSnapshot(snapshot)}
      metrics={metricsFromSnapshot(snapshot)}
      actions={
        <>
          <Button variant="primary" onClick={publishBulletin}>
            发布通报
          </Button>
          <Button variant="secondary" onClick={openSchool}>
            打开学校
          </Button>
          <Button variant="secondary" onClick={foundFaith}>
            建立信念
          </Button>
          <Button variant="ghost" onClick={blendBeliefs}>
            混合信念
          </Button>
          <Button variant="ghost" onClick={refresh}>
            刷新
          </Button>
        </>
      }
      footer="公开文案保持直白：如果浏览器无法深入某条路径，面板仍会展示可工作的降级方案，而不是把限制藏起来。"
    >
      <div style={{ display: 'grid', gap: '0.9rem', padding: '0 1rem 1rem' }}>
        <PanelSection title="正在流通的头条">
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {headlines.slice(0, 4).map((article) => (
              <Card
                key={article.id}
                variant="default"
                title={article.title}
                subtitle={new Date(article.timestamp).toLocaleString()}
                badge={<Badge variant={article.sentiment >= 0 ? 'success' : 'warning'}>{article.sentiment >= 0 ? '正向' : '批判'}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{article.content}</p>
              </Card>
            ))}
            {headlines.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>当前还没有头条。先发布第一条通报，为市民信息流播种。</div>
            )}
          </div>
        </PanelSection>

        <PanelSection title="教育晶格">
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {schools.map((school) => (
              <Card
                key={school.id}
                title={school.name}
                subtitle={`容量 ${school.students.length}/${school.educationCapacity}`}
                badge={<Badge variant="primary">知识 {school.knowledgeLevel.toFixed(0)}</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  教师：{school.teachers.length}。学费：{school.tuitionFee}。学生正在同一张公共学习图中成长。
                </p>
              </Card>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="信念网络">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.7rem' }}>
            {activeReligions.map((religion) => (
              <Card
                key={religion.id}
                title={religion.name}
                subtitle={religion.description}
                badge={<Badge variant="default">{religion.followers.length} 位追随者</Badge>}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  影响力 {religion.influence.toFixed(0)}。模因代码已上线，随时准备继续传播。
                </p>
              </Card>
            ))}
          </div>
        </PanelSection>
      </div>
    </FeaturePanelFrame>
  );
}

export default SocietyFeaturePanel;

